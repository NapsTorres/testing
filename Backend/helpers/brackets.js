const db = require("../middleware/db");
const util = require("util");
const pool = require("../middleware/db");
const queryAsync = util.promisify(pool.query).bind(pool);

exports.generateMatches = async (req, res) => {
  const { eventId } = req.params;
  let { bracketType, teams } = req.body;

  try {
    switch (bracketType) {
      case "Single Elimination":
        await generateSingleEliminationMatches(eventId, teams);
        break;
      case "Double Elimination":
        await generateDoubleEliminationMatches(eventId, teams);
        break;
      case "Round Robin":
        await generateRoundRobinMatches(eventId, teams);
        break;
      default:
        return res.status(400).json({ error: "Invalid bracket type" });
    }

    res.json({ message: `${bracketType} matches generated successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNextPowerOfTwo = (n) => {
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

const generateSingleEliminationMatches = async (
  sportEventsId,
  teams,
  sportsId
) => {
  const bracketQuery =
    "INSERT INTO brackets (sportsId, bracketType, isElimination) VALUES (?, ?, ?)";
  const matchQuery =
    "INSERT INTO matches (sportEventsId, bracketId, round, team1Id, team2Id, status, schedule, next_match_id, isFinal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const [bracketResult] = await db
    .promise()
    .query(bracketQuery, [sportsId, "Single Elimination Bracket", true]);
  const bracket_id = bracketResult.insertId;

  const matchIdMap = new Map(); // To store match IDs for reference
  const winnerToRound2Map = new Map(); // To store which round 2 match each winner should go to

  // Group teams by round
  const round1Teams = teams.filter(team => !team.round || team.round === 1);
  const round2Matches = teams.filter(team => team.round === 2);

  // First, map out where winners should go in round 2
  round2Matches.forEach(match => {
    if (match.team1?.winnerFrom) {
      winnerToRound2Map.set(match.team1.winnerFrom, {
        matchId: match.matchId,
        position: 'team1'
      });
    }
    if (match.team2?.winnerFrom) {
      winnerToRound2Map.set(match.team2.winnerFrom, {
        matchId: match.matchId,
        position: 'team2'
      });
    }
  });

  // Create first round matches
  for (let i = 0; i < round1Teams.length; i += 2) {
    const team1 = round1Teams[i];
    const team2 = round1Teams[i + 1];
    
    const [matchResult] = await db
      .promise()
      .query(matchQuery, [
        sportEventsId,
        bracket_id,
        1,
        team1?.teamId || null,
        team2?.teamId || null,
        "Pending",
        team1?.date || null,  // Use the date from the team data
        null,
        0,
      ]);
    const matchId = matchResult.insertId;
    matchIdMap.set(i/2 + 1, matchId); // Store match ID with its number (1-based)
  }

  // Create second round matches
  const round2MatchIds = [];
  const round2MatchesMap = new Map(); // Store round 2 matches for updating later
  
  for (const match of round2Matches) {
    // Create the match with the specified teams
    const [matchResult] = await db
      .promise()
      .query(matchQuery, [
        sportEventsId,
        bracket_id,
        2,
        match.team1?.teamId || null,
        match.team2?.teamId || null,
        "Pending",
        match.date || null,  // Use the date from the match data
        null,
        0,
      ]);
    const round2MatchId = matchResult.insertId;
    round2MatchIds.push(round2MatchId);
    round2MatchesMap.set(match.matchId, round2MatchId);

    // Link winners from round 1 to their designated spots in round 2
    if (match.team1?.winnerFrom) {
      const round1MatchId = matchIdMap.get(match.team1.winnerFrom);
      if (round1MatchId) {
        await db
          .promise()
          .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
            round2MatchId,
            round1MatchId
          ]);

        // Check if this match already has a winner and update round 2 if needed
        const [round1Match] = await db
          .promise()
          .query("SELECT winner_team_id FROM matches WHERE matchId = ?", [round1MatchId]);
        
        if (round1Match[0]?.winner_team_id) {
          await db
            .promise()
            .query("UPDATE matches SET team1Id = ? WHERE matchId = ?", [
              round1Match[0].winner_team_id,
              round2MatchId
            ]);
        }
      }
    }

    if (match.team2?.winnerFrom) {
      const round1MatchId = matchIdMap.get(match.team2.winnerFrom);
      if (round1MatchId) {
        await db
          .promise()
          .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
            round2MatchId,
            round1MatchId
          ]);

        // Check if this match already has a winner and update round 2 if needed
        const [round1Match] = await db
          .promise()
          .query("SELECT winner_team_id FROM matches WHERE matchId = ?", [round1MatchId]);
        
        if (round1Match[0]?.winner_team_id) {
          await db
            .promise()
            .query("UPDATE matches SET team2Id = ? WHERE matchId = ?", [
              round1Match[0].winner_team_id,
              round2MatchId
            ]);
        }
      }
    }
  }

  currentRoundMatchIds = round2MatchIds;
  let round = 3;

  // Continue with remaining rounds
  while (currentRoundMatchIds.length > 1) {
    const nextRoundMatchIds = [];

    for (let i = 0; i < currentRoundMatchIds.length; i += 2) {
      const [nextMatchResult] = await db
        .promise()
        .query(matchQuery, [
          sportEventsId,
          bracket_id,
          round,
          null,
          null,
          "Pending",
          null,
          null,
          0,
        ]);
      const nextMatchId = nextMatchResult.insertId;
      nextRoundMatchIds.push(nextMatchId);

      await db
        .promise()
        .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
          nextMatchId,
          currentRoundMatchIds[i],
        ]);
      if (currentRoundMatchIds[i + 1]) {
        await db
          .promise()
          .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
            nextMatchId,
            currentRoundMatchIds[i + 1],
          ]);
      }
    }

    currentRoundMatchIds = nextRoundMatchIds;
    round++;
  }

  if (currentRoundMatchIds.length === 1) {
    await db
      .promise()
      .query("UPDATE matches SET isFinal = 1 WHERE matchId = ?", [
        currentRoundMatchIds[0],
      ]);
  }
};

const generateDoubleEliminationMatches = async (sportEventsId, teams, sportsId) => {
  const bracketQuery =
    "INSERT INTO brackets (sportsId, bracketType, isElimination) VALUES (?, ?, ?)";
  const matchQuery =
    "INSERT INTO matches (sportEventsId, bracketId, round, team1Id, team2Id, status, schedule, next_match_id, loser_next_match_id, isFinal, bracketType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  // Create brackets
  const [winnerBracketResult] = await db
    .promise()
    .query(bracketQuery, [sportsId, "Winner Bracket", true]);
  const [loserBracketResult] = await db
    .promise()
    .query(bracketQuery, [sportsId, "Loser Bracket", true]);
  const [finalRematchBracketResult] = await db
    .promise()
    .query(bracketQuery, [sportsId, "Final Rematch", true]);

  const winner_bracket_id = winnerBracketResult.insertId;
  const loser_bracket_id = loserBracketResult.insertId;
  const final_rematch_bracket_id = finalRematchBracketResult.insertId;

  // Group teams by round
  const round1Teams = teams.filter(team => !team.round || team.round === 1);
  const round2Matches = teams.filter(team => team.round === 2);

  // Create first round matches in winner bracket
  const winnerRound1MatchIds = new Map(); // Store match IDs for reference
  for (let i = 0; i < round1Teams.length; i += 2) {
    const team1 = round1Teams[i];
    const team2 = round1Teams[i + 1];
    
    const [matchResult] = await db
      .promise()
      .query(matchQuery, [
        sportEventsId,
        winner_bracket_id,
        1,
        team1?.teamId || null,
        team2?.teamId || null,
        "Pending",
        team1?.date || null,
        null,
        null,
        0,
        "winners",
      ]);
    const matchId = matchResult.insertId;
    winnerRound1MatchIds.set(i/2 + 1, matchId); // Store match ID with its number (1-based)
  }

  // Create second round matches in winner bracket with proper team placement
  const winnerRound2MatchIds = [];
  const loserRound1MatchIds = [];

  for (const match of round2Matches) {
    // Create winner bracket match
    const [winnerMatchResult] = await db
      .promise()
      .query(matchQuery, [
        sportEventsId,
        winner_bracket_id,
        2,
        match.team1?.teamId || null,
        match.team2?.teamId || null,
        "Pending",
        match.date || null,
        null,
        null,
        0,
        "winners",
      ]);
    const winnerMatchId = winnerMatchResult.insertId;
    winnerRound2MatchIds.push(winnerMatchId);

    // Link winners from round 1 to their designated spots in round 2
    if (match.team1?.winnerFrom) {
      const round1MatchId = winnerRound1MatchIds.get(match.team1.winnerFrom);
      if (round1MatchId) {
        await db
          .promise()
          .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
            winnerMatchId,
            round1MatchId,
          ]);
      }
    }
    if (match.team2?.winnerFrom) {
      const round1MatchId = winnerRound1MatchIds.get(match.team2.winnerFrom);
      if (round1MatchId) {
        await db
          .promise()
          .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
            winnerMatchId,
            round1MatchId,
          ]);
      }
    }

    // Create corresponding loser bracket match only if there are first round matches
    if (round1Teams.length > 0) {
      const [loserMatchResult] = await db
        .promise()
        .query(matchQuery, [
          sportEventsId,
          loser_bracket_id,
          1,
          null,
          null,
          "Pending",
          null,
          null,
          null,
          0,
          "losers",
        ]);
      const loserMatchId = loserMatchResult.insertId;
      loserRound1MatchIds.push(loserMatchId);

      // Link losers from winner bracket to loser bracket
      const round1MatchIds = [
        match.team1?.winnerFrom ? winnerRound1MatchIds.get(match.team1.winnerFrom) : null,
        match.team2?.winnerFrom ? winnerRound1MatchIds.get(match.team2.winnerFrom) : null,
      ].filter(id => id !== null);

      for (const matchId of round1MatchIds) {
        if (matchId) {
          await db
            .promise()
            .query("UPDATE matches SET loser_next_match_id = ? WHERE matchId = ?", [
              loserMatchId,
              matchId,
            ]);
        }
      }
    }
  }

  // Create final winner bracket match if needed
  if (winnerRound2MatchIds.length > 1) {
    const [finalWinnerMatchResult] = await db
      .promise()
      .query(matchQuery, [
        sportEventsId,
        winner_bracket_id,
        3,
        null,
        null,
        "Pending",
        null,
        null,
        null,
        0,
        "winners",
      ]);
    const finalWinnerMatchId = finalWinnerMatchResult.insertId;

    // Link winners from round 2 to final winner match
    for (const matchId of winnerRound2MatchIds) {
      await db
        .promise()
        .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
          finalWinnerMatchId,
          matchId,
        ]);
    }
  }

  // Create loser bracket progression matches only if there are matches in loser bracket
  if (loserRound1MatchIds.length > 0) {
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const shouldSkipRound1 = loserRound1MatchIds.length < (nextPowerOfTwo / 2);
    
    let currentLoserRoundMatchIds = loserRound1MatchIds;
    let loserRound = shouldSkipRound1 ? 2 : 1;

    // If we're skipping round 1, we'll create round 2 matches directly
    if (shouldSkipRound1) {
      const loserRound2MatchIds = [];
      const totalRound2Matches = Math.ceil((loserRound1MatchIds.length + winnerRound2MatchIds.length) / 2);

      for (let i = 0; i < totalRound2Matches; i++) {
        const [loserMatchResult] = await db
          .promise()
          .query(matchQuery, [
            sportEventsId,
            loser_bracket_id,
            2,
            null,
            null,
            "Pending",
            null,
            null,
            null,
            0,
            "losers",
          ]);
        const loserMatchId = loserMatchResult.insertId;
        loserRound2MatchIds.push(loserMatchId);

        // Link losers from winner bracket to these matches
        if (i < winnerRound2MatchIds.length) {
          await db
            .promise()
            .query("UPDATE matches SET loser_next_match_id = ? WHERE matchId = ?", [
              loserMatchId,
              winnerRound2MatchIds[i],
            ]);
        }
        
        // Link losers from round 1 to these matches
        if (i < loserRound1MatchIds.length) {
          await db
            .promise()
            .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
              loserMatchId,
              loserRound1MatchIds[i],
            ]);
        }
      }

      currentLoserRoundMatchIds = loserRound2MatchIds;
      loserRound = 3;
    } else {
      // Original code for when we don't skip round 1
      // Create first set of matches for losers from winner bracket round 2
      const loserRound2MatchIds = [];
      for (let i = 0; i < winnerRound2MatchIds.length; i++) {
        const [loserMatchResult] = await db
          .promise()
          .query(matchQuery, [
            sportEventsId,
            loser_bracket_id,
            2,
            null,
            null,
            "Pending",
            null,
            null,
            null,
            0,
            "losers",
          ]);
        const loserMatchId = loserMatchResult.insertId;
        loserRound2MatchIds.push(loserMatchId);

        // Link loser from winner bracket round 2 to this match
        await db
          .promise()
          .query("UPDATE matches SET loser_next_match_id = ? WHERE matchId = ?", [
            loserMatchId,
            winnerRound2MatchIds[i],
          ]);
      }

      // Merge loser matches from both rounds for further progression
      currentLoserRoundMatchIds = [...currentLoserRoundMatchIds, ...loserRound2MatchIds];
      loserRound = 3;
    }

    while (currentLoserRoundMatchIds.length > 1) {
      const nextRoundMatchIds = [];
      
      for (let i = 0; i < currentLoserRoundMatchIds.length; i += 2) {
        const [matchResult] = await db
          .promise()
          .query(matchQuery, [
            sportEventsId,
            loser_bracket_id,
            loserRound,
            null,
            null,
            "Pending",
            null,
            null,
            null,
            0,
            "losers",
          ]);
        const matchId = matchResult.insertId;
        nextRoundMatchIds.push(matchId);

        // Link previous matches to this one
        await db
          .promise()
          .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
            matchId,
            currentLoserRoundMatchIds[i],
          ]);
        if (currentLoserRoundMatchIds[i + 1]) {
          await db
            .promise()
            .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
              matchId,
              currentLoserRoundMatchIds[i + 1],
            ]);
        }
      }

      currentLoserRoundMatchIds = nextRoundMatchIds;
      loserRound++;
    }

    // Create final loser bracket match if needed
    if (currentLoserRoundMatchIds.length === 1) {
      const [finalLoserMatchResult] = await db
        .promise()
        .query(matchQuery, [
          sportEventsId,
          loser_bracket_id,
          loserRound,
          null,
          null,
          "Pending",
          null,
          null,
          null,
          0,
          "losers",
        ]);
      const finalLoserMatchId = finalLoserMatchResult.insertId;

      // Link last loser match to final
      await db
        .promise()
        .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
          finalLoserMatchId,
          currentLoserRoundMatchIds[0],
        ]);

      // Create final match (winner bracket winner vs loser bracket winner)
      const [firstFinalMatchResult] = await db
        .promise()
        .query(matchQuery, [
          sportEventsId,
          winner_bracket_id,
          loserRound + 1,
          null,
          null,
          "Pending",
          null,
          null,
          null,
          1,
          "final",
        ]);
      const firstFinalMatchId = firstFinalMatchResult.insertId;

      // Link winners to final
      const lastWinnerMatch = winnerRound2MatchIds.length > 1 ? 
        await queryAsync("SELECT matchId FROM matches WHERE bracketType = 'winners' AND round = 3 AND sportEventsId = ? LIMIT 1", [sportEventsId]) :
        winnerRound2MatchIds[0];

      await db
        .promise()
        .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
          firstFinalMatchId,
          lastWinnerMatch.matchId || lastWinnerMatch,
        ]);
      await db
        .promise()
        .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
          firstFinalMatchId,
          finalLoserMatchId,
        ]);

      // Create potential reset match
      const [resetMatchResult] = await db
        .promise()
        .query(matchQuery, [
          sportEventsId,
          final_rematch_bracket_id,
          loserRound + 2,
          null,
          null,
          "Pending",
          null,
          null,
          null,
          1,
          "final_rematch",
        ]);
      const resetMatchId = resetMatchResult.insertId;

      // Link final to potential reset match
      await db
        .promise()
        .query("UPDATE matches SET next_match_id = ? WHERE matchId = ?", [
          resetMatchId,
          firstFinalMatchId,
        ]);
    }
  }
};

const generateRoundRobinMatches = async (sportEventsId, teams,sportsId) => {

  const bracketQuery =
    "INSERT INTO brackets (sportsId, bracketType, isElimination) VALUES (?, ?, ?)";
  const matchQuery =
    "INSERT INTO matches (sportEventsId, bracketId, round, team1Id, team2Id, status, schedule) VALUES (?, ?, ?, ?, ?, ?, ?)";

  const [bracketResult] = await db
    .promise()
    .query(bracketQuery, [sportsId, "Round Robin Bracket", false]);
  const bracket_id = bracketResult.insertId;

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  let schedule = [];

  for (let round = 0; round < numRounds; round++) {
    let roundMatches = [];
    for (let match = 0; match < matchesPerRound; match++) {
      const team1Index = (round + match) % (numTeams - 1);
      const team2Index = (numTeams - 1 - match + round) % (numTeams - 1);

      if (match === 0) {
        roundMatches.push([teams[0].teamId, teams[team2Index + 1].teamId]);
      } else {
        roundMatches.push([
          teams[team1Index + 1].teamId,
          teams[team2Index + 1].teamId,
        ]);
      }
    }
    schedule.push(roundMatches);
  }

  for (let round = 0; round < numRounds; round++) {
    for (const [team1Id, team2Id] of schedule[round]) {
      await db
        .promise()
        .query(matchQuery, [
          sportEventsId,
          bracket_id,
          round + 1,
          team1Id,
          team2Id,
          "Pending",
          null,
        ]);
    }
  }
};

const advanceWinnerToNextMatch = async (winnerId, nextMatchId) => {
  try {
    const nextMatch = await queryAsync(
      "SELECT * FROM matches WHERE matchId = ?",
      [nextMatchId]
    );
    if (nextMatch.length === 0) {
      throw new Error("Next match not found");
    }

    const nextMatchRecord = nextMatch[0];
    const { team1Id, team2Id, next_match_id } = nextMatchRecord;
    const updateField = team1Id ? "team2Id" : "team1Id";

    await queryAsync(
      `UPDATE matches SET ${updateField} = ? WHERE matchId = ?`,
      [winnerId, nextMatchId]
    );

    if (next_match_id) {
      await advanceWinnerToNextMatch(winnerId, next_match_id);
    }
  } catch (error) {
    console.error("Error advancing winner to next match:", error);
  }
};

async function setTeamInNextMatch(matchId, teamId, stat) {
  if (!teamId) {
    console.error("Invalid teamId provided:", teamId);
    return;
  }

  try {
    // First get the current match details including next_match_id
    const [match] = await queryAsync(
      "SELECT matchId, team1Id, team2Id, next_match_id, team1stat, team2stat FROM matches WHERE matchId = ?", 
      [matchId]
    );

    if (match.length === 0) {
      console.error(`Match with matchId ${matchId} not found.`);
      return;
    }

    // If this match has a next_match_id, we need to update the corresponding match
    if (match.next_match_id) {
      const [nextMatch] = await queryAsync(
        "SELECT team1Id, team2Id, team1stat, team2stat FROM matches WHERE matchId = ?",
        [match.next_match_id]
      );

      // Check if this winner should go to a specific position based on the bracket setup
      const winnerFromMatch = await queryAsync(
        "SELECT team1Id, team2Id, team1stat, team2stat FROM matches WHERE next_match_id = ? AND matchId != ?",
        [match.next_match_id, matchId]
      );

      let updateField = "team1Id";
      let statistics = "team1stat";

      // If there's another match feeding into this one, respect the positions
      if (winnerFromMatch.length > 0) {
        // If the other match's winner goes to team1, this one goes to team2
        if (winnerFromMatch[0].team1Id === null) {
          updateField = "team2Id";
          statistics = "team2stat";
        }
      } else {
        // If no specific position is set, use first available position
        if (nextMatch.team1Id !== null) {
          updateField = "team2Id";
          statistics = "team2stat";
        }
      }

      // Update the next match with the winner
      await queryAsync(
        `UPDATE matches SET ${updateField} = ?, ${statistics} = ? WHERE matchId = ?`,
        [teamId, stat, match.next_match_id]
      );

      console.log(
        `Updated ${updateField} in next match ${match.next_match_id} with winner team ${teamId}`
      );
    }

  } catch (error) {
    console.error("Error in setTeamInNextMatch:", error);
  }
}


async function checkForChampion(winnerTeamId, loserTeamId, match) {
  const matchQuery = `
  INSERT INTO matches (
    sportEventsId, 
    bracketId, 
    round, 
    team1Id, 
    team2Id, 
    status, 
    schedule, 
    next_match_id, 
    loser_next_match_id, 
    isFinal, 
    bracketType
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  if (match.isFinal && match.bracketType === "final") {
    console.log('checking')
    if (loserTeamId && ((match.team1stat === "winnerBracket" && match.team1Id === loserTeamId) ||
    (match.team2stat === "winnerBracket" && match.team2Id === loserTeamId))) {
      const [existingResetMatch] = await db
      .promise()
      .query(
        "SELECT * FROM matches WHERE isFinal = 1 AND bracketType = 'final_rematch' AND matchId = ?",
        [match.next_match_id]
      );
    

      if (existingResetMatch.length > 0) {

        const resetMatch = existingResetMatch[0];
        if (
          (match.team1stat === "winnerBracket" && match.team1Id === loserTeamId) ||
          (match.team2stat === "winnerBracket" && match.team2Id === loserTeamId)
        ) {
          console.log('here',loserTeamId)
          await db.promise().query(
            "UPDATE matches SET team2Id = ? WHERE matchId = ?",
            [loserTeamId, resetMatch.matchId]
          );
          console.log(
            `Updated team2Id in reset match (ID: ${resetMatch.matchId}) with team from Winner Bracket.`
          );
        }
      } else {
        const [resetMatchResult] = await db.promise().query(matchQuery, [
          match.sportEventsId, 
          6, 
          match.round + 1, 
          loserTeamId,
          winnerTeamId, 
          "Pending", 
          null, 
          null, 
          null,
          1,
          "final_rematch", 
        ]);

        const resetMatchId = resetMatchResult.insertId;

        await db
          .promise()
          .query(
            "UPDATE matches SET loser_next_match_id = ? WHERE matchId = ?",
            [resetMatchId, match.matchId]
          );

        console.log(`Reset match created with ID: ${resetMatchId}`);
      }
    } else {
      return winnerTeamId; 
    }
  }

  if (match.isFinal && match.bracketType === "final_rematch") {
    return winnerTeamId;
  }

  return null; 
}

const updateTeamStanding = async (winnerTeamId, loserTeamId,sportEventId) => {
  try {
    await db
    .promise()
    .query(
      "UPDATE teams_events SET teamWin = teamWin + 1 WHERE teamId = ? and sportEventsId = ?",
      [winnerTeamId,sportEventId]
    );

    await db
    .promise()
    .query(
      "UPDATE teams_events SET teamLose = teamLose + 1 WHERE teamId = ? and sportEventsId = ?",
      [loserTeamId,sportEventId]
    );
  } catch (error) {
    console.error("Error updating team standings:", error);
    throw new Error("Failed to update team standings");
  }
};

const doubleSetWinner = async (data) => {
  const { team1Score, team2Score, matchId } = data;

  try {
    const matchResult = await queryAsync(
      "SELECT * FROM matches WHERE matchId = ?",
      [matchId]
    );
    if (matchResult.length === 0)
      return { success: 0, message: "Match not found" };

    const match = matchResult[0];
    const {
      team1Id,
      team2Id,
      bracketType,
      next_match_id,
      loser_next_match_id,
      sportEventsId,
      isFinal,
    } = match;

    let winnerTeamId, loserTeamId;
    if (team1Score > team2Score) {
      winnerTeamId = team1Id;
      loserTeamId = team2Id;
    } else if (team2Score > team1Score) {
      winnerTeamId = team2Id;
      loserTeamId = team1Id;
    } else {
      return {
        success: 0,
        message: "Scores cannot be equal in elimination matches.",
      };
    }

    // Update current match with scores and winner
    await queryAsync(
      "UPDATE matches SET team1Score = ?, team2Score = ?, winner_team_id = ?, status = 'completed' WHERE matchId = ?",
      [team1Score, team2Score, winnerTeamId, matchId]
    );

    await updateTeamStanding(winnerTeamId, loserTeamId, sportEventsId);

    // Handle winner progression (similar to single elimination)
    if (next_match_id) {
      const [nextMatch] = await queryAsync(
        "SELECT * FROM matches WHERE matchId = ?",
        [next_match_id]
      );

      if (nextMatch) {
        // Find if there's another match feeding into the same next match
        const [otherMatch] = await queryAsync(
          "SELECT * FROM matches WHERE next_match_id = ? AND matchId != ?",
          [next_match_id, matchId]
        );

        // Determine which position this winner should take
        let updateField = "team1Id";
        let updateStat = "team1stat";

        // If there's another match feeding into this one, coordinate positions
        if (otherMatch) {
          if (otherMatch.team1Id === null) {
            updateField = "team2Id";
            updateStat = "team2stat";
          }
        } else {
          // If no other match, use first available position
          if (nextMatch.team1Id !== null) {
            updateField = "team2Id";
            updateStat = "team2stat";
          }
        }

        // Update next match with winner
        await queryAsync(
          `UPDATE matches SET ${updateField} = ?, ${updateStat} = ? WHERE matchId = ?`,
          [winnerTeamId, bracketType === 'winners' ? 'winnerBracket' : 'loserBracket', next_match_id]
        );
      }
    }

    // Handle loser progression to loser bracket
    if (loser_next_match_id) {
      const [loserNextMatch] = await queryAsync(
        "SELECT * FROM matches WHERE matchId = ?",
        [loser_next_match_id]
      );

      if (loserNextMatch) {
        // Similar logic for loser placement
        let updateField = "team1Id";
        let updateStat = "team1stat";

        const [otherLoserMatch] = await queryAsync(
          "SELECT * FROM matches WHERE next_match_id = ? AND matchId != ?",
          [loser_next_match_id, matchId]
        );

        if (otherLoserMatch) {
          if (otherLoserMatch.team1Id === null) {
            updateField = "team2Id";
            updateStat = "team2stat";
          }
        } else if (loserNextMatch.team1Id !== null) {
            updateField = "team2Id";
            updateStat = "team2stat";
          }

        await queryAsync(
          `UPDATE matches SET ${updateField} = ?, ${updateStat} = ? WHERE matchId = ?`,
          [loserTeamId, 'loser', loser_next_match_id]
        );
      }
    }

    // Check for champion
    const champion = await checkForChampion(winnerTeamId, loserTeamId, match);
    if (champion) {
      return { success: 1, message: "Champion decided", champion };
    }

    return {
      success: 1,
      message: "Winner set and progression updated successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      success: 0,
      message: "An error occurred while updating the winner.",
    };
  }
};

module.exports = {
  generateDoubleEliminationMatches,
  generateSingleEliminationMatches,
  generateRoundRobinMatches,
  setTeamInNextMatch,
  checkForChampion,
  updateTeamStanding,
  doubleSetWinner
};