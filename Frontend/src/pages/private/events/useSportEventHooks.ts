/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from '@tanstack/react-query';
import { useFetchData } from '../../../config/axios/requestData';
import useEventsRequest from '../../../config/data/events';
import EventsServices from '../../../config/service/events';
import { Team } from '../../../types';
import { useState } from 'react';

export interface SportEventInformationProps {
    sportDetails: {
        sportsId: any;
        sportInfo: {
            sportsName: string;
            sportsLogo: string;
            description: string;
        };
        sportEventsId: any;
        teams: Team[];
        bracketType: 'Single Elimination' | 'Double Elimination' | 'Round Robin';
    };
}

export default function useSportEventHooks({sportDetails}: SportEventInformationProps) {
    const queryClient = useQueryClient();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const sportEventsId = sportDetails.sportEventsId;
    
    const { data: [matches] = [] } = useFetchData(
        ["matches"],
        [() => EventsServices.bracketMatch(sportEventsId)]
    );
    
    const { createMatchMaking, isLoading } = useEventsRequest({});

    const handleGenerateMatchup = async(values: any) => {
        let teamsToSend: any[] = [];
        
        if(sportDetails.bracketType !== 'Round Robin') {
            // Transform the matches array into a structured format
            values.forEach((match: any) => {
                if (match.round === 1) {
                    if (match.team1Id) teamsToSend.push({ 
                        teamId: match.team1Id, 
                        round: 1,
                        date: match.date ? match.date.toISOString() : null 
                    });
                    if (match.team2Id) teamsToSend.push({ 
                        teamId: match.team2Id, 
                        round: 1,
                        date: match.date ? match.date.toISOString() : null 
                    });
                } else if (match.round === 2) {
                    // For round 2, create a match object that includes winner references
                    const round2Match = {
                        round: 2,
                        matchId: match.id,
                        date: match.date ? match.date.toISOString() : null,
                        team1: match.team1Id 
                            ? { teamId: match.team1Id }
                            : { winnerFrom: match.team1WinnerFromMatch },
                        team2: match.team2Id 
                            ? { teamId: match.team2Id }
                            : { winnerFrom: match.team2WinnerFromMatch }
                    };
                    teamsToSend.push(round2Match);
                }
            });
        } else {
            teamsToSend = values.map((team: Team) => ({ teamId: team.teamId }));
        }
        
        console.log('Teams to send:', teamsToSend);
        
        const formData = new FormData();
        formData.append('sportsId', sportDetails.sportsId);
        formData.append('sportEventsId', sportDetails.sportEventsId);
        formData.append('bracketType', sportDetails.bracketType);
        formData.append('teams', JSON.stringify(teamsToSend));
        
        createMatchMaking(formData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["matches"] });
                setIsModalVisible(false);
            },
        });
    }

    const showModal = () => setIsModalVisible(true);
    const handleCloseModal = () => setIsModalVisible(false);

    return {
        isLoading,
        matches,
        isModalVisible,
        handleGenerateMatchup,
        showModal,
        handleCloseModal
    }
}
