import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@shared/Models/gameInfo';


export default function Timer({ timerActive, playerNumber, getPlayers }: { timerActive: boolean; playerNumber: number, getPlayers: GamePlayer[] }) {
    const [displayTime, setDisplayTime] = useState(0);

    // Effect to handle player time updates
    useEffect(() => {
        //console.log(timerActive, playerNumber, getPlayers);
        if (getPlayers.length > 0 && getPlayers[playerNumber]?.time !== undefined) {
            setDisplayTime(getPlayers[playerNumber].time);
        }
    }, [getPlayers, playerNumber]);

    // Effect to handle countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (timerActive && displayTime > 0 && getPlayers.length > 0) {
            interval = setInterval(() => {
                setDisplayTime(prevTime => {
                    if (prevTime <= 10) {
                        return 0;
                    }
                    return prevTime - 10;
                });
            }, 10);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [timerActive, getPlayers, displayTime]);

    const formatTime = (ms: number) => {
        if (ms < 0) {
            return '00:00:00';
        }
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    };

    return <div>{formatTime(displayTime)}</div>;
}