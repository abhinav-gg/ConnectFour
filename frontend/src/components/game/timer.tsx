import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@shared/Models/gameInfo';


export default function Timer({ timerActive, playerNumber, getPlayers, onTimeout }: { timerActive: boolean; playerNumber: number, getPlayers: GamePlayer[], onTimeout: () => void }) {
    const [displayTime, setDisplayTime] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);

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
            const setupTime = getPlayers[playerNumber].time;
            if (!startTime){
                setStartTime(Date.now());
            }
            interval = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - startTime!));
                const newTime = setupTime - elapsedTime;
                setDisplayTime(_ => newTime);
                if (newTime <= 0) {
                    clearInterval(interval);
                }
            }, 35);
        } else {
            setStartTime(null);
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