/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { DatePicker, Select, Button, Form, Tabs } from "antd";
import moment from "moment";
import { Team } from "../../types";
import useSportEventHooks from "../../pages/private/events/useSportEventHooks";

const { Option } = Select;
const { TabPane } = Tabs;

interface Match {
  id: number;
  team1Id: number | null;
  team2Id: number | null;
  date: moment.Moment | null;
  round: number;
  team1WinnerFromMatch?: number | null;
  team2WinnerFromMatch?: number | null;
  team1IsWinner?: boolean;
}

type SelectValue = number | string | undefined;

const AdminMatchForm = ({
  teams,
  sportDetails,
  onClose,
}: {
  teams: Team[];
  sportDetails: any;
  onClose: () => void;
}) => {
  const { isLoading, handleGenerateMatchup } = useSportEventHooks({
    sportDetails,
  });

  // Calculate matches needed for each round
  const calculateMatches = (teams: Team[]) => {
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const numByes = nextPowerOfTwo - teams.length;
    
    // For first round, we want teams that don't get byes to play
    const teamsInFirstRound = teams.length - numByes;
    const firstRoundMatches = Math.floor(teamsInFirstRound / 2);

    // For second round:
    // - We'll have winners from first round matches
    // - Plus the teams that got byes
    const teamsInSecondRound = firstRoundMatches + numByes;
    const secondRoundMatches = Math.ceil(teamsInSecondRound / 2);

    console.log({
      totalTeams: teams.length,
      nextPowerOfTwo,
      numByes,
      teamsInFirstRound,
      firstRoundMatches,
      teamsInSecondRound,
      secondRoundMatches
    });

    // Create first round matches
    const round1Matches = Array.from({ length: firstRoundMatches }, (_, i) => ({
      id: i + 1,
      team1Id: null,
      team2Id: null,
      date: null,
      round: 1
    }));

    // Create second round matches
    const round2Matches = Array.from({ length: secondRoundMatches }, (_, i) => ({
      id: firstRoundMatches + i + 1,
      team1Id: null,
      team2Id: null,
      date: null,
      round: 2,
      team1WinnerFromMatch: null,
      team2WinnerFromMatch: null
    }));

    return [...round1Matches, ...round2Matches];
  };

  const [matches, setMatches] = useState<Match[]>(calculateMatches(teams));

  useEffect(() => {
    setMatches(calculateMatches(teams));
  }, [teams]);

  // Track which winners are already selected
  const selectedWinners = matches.reduce<number[]>((acc, match) => {
    if (match.team1WinnerFromMatch) acc.push(match.team1WinnerFromMatch);
    if (match.team2WinnerFromMatch) acc.push(match.team2WinnerFromMatch);
    return acc;
  }, []);

  // Track which teams are selected (excluding the current match)
  const getSelectedTeamIds = (currentMatchId: number) => {
    return matches
      .filter(m => m.id !== currentMatchId)
      .reduce<number[]>((acc, match) => {
        if (match.team1Id) acc.push(match.team1Id);
        if (match.team2Id) acc.push(match.team2Id);
        return acc;
      }, []);
  };

  const handleTeamChange = (
    matchId: number,
    teamKey: "team1Id" | "team2Id" | "winnerFromMatch",
    value: number | undefined,
    position: "team1" | "team2"
  ) => {
    setMatches((prevMatches) =>
      prevMatches.map((match) => {
        if (match.id === matchId) {
          if (teamKey === "winnerFromMatch") {
            const matchNumber = typeof value === 'number' ? value : null;
            
            if (position === "team1") {
              return {
                ...match,
                team1Id: null,
                team1WinnerFromMatch: matchNumber,
                team1IsWinner: true,
                team2Id: match.team2Id,
                team2WinnerFromMatch: match.team2WinnerFromMatch
              };
            } else {
              return {
                ...match,
                team2Id: null,
                team2WinnerFromMatch: matchNumber,
                team1IsWinner: false,
                team1Id: match.team1Id,
                team1WinnerFromMatch: match.team1WinnerFromMatch
              };
            }
          } else {
            // For regular team selections
            return {
              ...match,
              [teamKey]: value || null,
              ...(position === "team1" ? {
                team1WinnerFromMatch: null,
                team1IsWinner: undefined
              } : {
                team2WinnerFromMatch: null
              })
            };
          }
        }
        return match;
      })
    );
  };

  const handleDateChange = (matchId: number, date: moment.Moment | null) => {
    setMatches((prevMatches) =>
      prevMatches.map((match) =>
        match.id === matchId ? { ...match, date } : match
      )
    );
  };

  const round1Matches = matches.filter(match => match.round === 1);
  const round2Matches = matches.filter(match => match.round === 2);

  return (
    <div className="p-6 rounded-lg">
      <Form layout="vertical">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Round 1" key="1">
            {round1Matches.map((match) => (
              <div key={match.id} className="grid grid-cols-3 gap-4 mb-4">
                <Form.Item label={`Match ${match.id} - Team 1`}>
                  <Select
                    placeholder="Select Team 1"
                    value={match.team1Id || undefined}
                    onChange={(value) =>
                      handleTeamChange(match.id, "team1Id", value, "team1")
                    }
                  >
                    {teams
                      .filter(
                        (team) =>
                          team.teamId !== match.team2Id &&
                          (!getSelectedTeamIds(match.id).includes(team.teamId) ||
                            team.teamId === match.team1Id)
                      )
                      .map((team) => (
                        <Option key={team.teamId} value={team.teamId}>
                          {team.teamName}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item label={`Match ${match.id} - Team 2`}>
                  <Select
                    placeholder="Select Team 2"
                    value={match.team2Id || undefined}
                    onChange={(value) =>
                      handleTeamChange(match.id, "team2Id", value, "team2")
                    }
                  >
                    {teams
                      .filter(
                        (team) =>
                          team.teamId !== match.team1Id &&
                          (!getSelectedTeamIds(match.id).includes(team.teamId) ||
                            team.teamId === match.team2Id)
                      )
                      .map((team) => (
                        <Option key={team.teamId} value={team.teamId}>
                          {team.teamName}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Date">
                  <DatePicker
                    showTime={{ use12Hours: true, format: "hh:mm A" }}
                    format="DD/MM/YYYY hh:mm A"
                    value={match.date}
                    onChange={(date) => handleDateChange(match.id, date)}
                    placeholder="dd/mm/yyyy --:-- AM/PM"
                    className="w-full"
                  />
                </Form.Item>
              </div>
            ))}
          </TabPane>

          <TabPane tab="Round 2 (Byes & Winners)" key="2">
            {round2Matches.map((match) => (
              <div key={match.id} className="grid grid-cols-3 gap-4 mb-4">
                <Form.Item label={`Match ${match.id} - Team/Winner 1`}>
                  <Select
                    placeholder="Select Team or Winner"
                    value={match.team1Id || (match.team1WinnerFromMatch ? `winner_${match.team1WinnerFromMatch}` : undefined)}
                    onChange={(value: SelectValue) => {
                      if (typeof value === 'string' && value.startsWith('winner_')) {
                        const matchId = parseInt(value.split('_')[1]);
                        handleTeamChange(match.id, "winnerFromMatch", matchId, "team1");
                      } else if (typeof value === 'number') {
                        handleTeamChange(match.id, "team1Id", value, "team1");
                      }
                    }}
                  >
                    <Select.OptGroup label="Teams">
                      {teams
                        .filter(
                          (team) =>
                            team.teamId !== match.team2Id &&
                            (!getSelectedTeamIds(match.id).includes(team.teamId) ||
                              team.teamId === match.team1Id)
                        )
                        .map((team) => (
                          <Option key={team.teamId} value={team.teamId}>
                            {team.teamName}
                          </Option>
                        ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="Winners from Round 1">
                      {round1Matches.map((r1Match) => {
                        const isWinnerSelected = selectedWinners.includes(r1Match.id) && 
                          match.team1WinnerFromMatch !== r1Match.id;
                        
                        return !isWinnerSelected ? (
                          <Option key={`winner_${r1Match.id}`} value={`winner_${r1Match.id}`}>
                            Winner of Match {r1Match.id}
                          </Option>
                        ) : null;
                      })}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>

                <Form.Item label={`Match ${match.id} - Team/Winner 2`}>
                  <Select
                    placeholder="Select Team or Winner"
                    value={match.team2Id || (match.team2WinnerFromMatch ? `winner_${match.team2WinnerFromMatch}` : undefined)}
                    onChange={(value: SelectValue) => {
                      if (typeof value === 'string' && value.startsWith('winner_')) {
                        const matchId = parseInt(value.split('_')[1]);
                        handleTeamChange(match.id, "winnerFromMatch", matchId, "team2");
                      } else if (typeof value === 'number') {
                        handleTeamChange(match.id, "team2Id", value, "team2");
                      }
                    }}
                  >
                    <Select.OptGroup label="Teams">
                      {teams
                        .filter(
                          (team) =>
                            team.teamId !== match.team1Id &&
                            (!getSelectedTeamIds(match.id).includes(team.teamId) ||
                              team.teamId === match.team2Id)
                        )
                        .map((team) => (
                          <Option key={team.teamId} value={team.teamId}>
                            {team.teamName}
                          </Option>
                        ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="Winners from Round 1">
                      {round1Matches.map((r1Match) => {
                        const isWinnerSelected = selectedWinners.includes(r1Match.id) && 
                          match.team2WinnerFromMatch !== r1Match.id;
                        
                        return !isWinnerSelected ? (
                          <Option key={`winner_${r1Match.id}`} value={`winner_${r1Match.id}`}>
                            Winner of Match {r1Match.id}
                          </Option>
                        ) : null;
                      })}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>

                <Form.Item label="Date">
                  <DatePicker
                    showTime={{ use12Hours: true, format: "hh:mm A" }}
                    format="DD/MM/YYYY hh:mm A"
                    value={match.date}
                    onChange={(date) => handleDateChange(match.id, date)}
                    placeholder="dd/mm/yyyy --:-- AM/PM"
                    className="w-full"
                  />
                </Form.Item>
              </div>
            ))}
          </TabPane>
        </Tabs>

        <div className="flex justify-end w-full gap-4">
          <Button type="default">Cancel</Button>
          <Button
            type="primary"
            loading={isLoading}
            onClick={async () => {
              await handleGenerateMatchup(matches);
              onClose();
            }}
          >
            Generate Matches
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AdminMatchForm;
