import { dbOperations } from '@/db/operations';
import type { SendToRoom } from '@shared/Models/gameInfo';
import { eventEmitter } from '@shared/utils/eventEmitter';
import type expressWs from 'express-ws';
import type { WebSocket as WSocket } from 'ws';


// Create a websocket connection for the waiting room
// Store the user id and the websocket connection
// Be prepared to send the user to a room when they are matched
// Also allow for waiting when the game is finished for a rematch or new game
// make a room map from id to ws
// Create a state object to hold persistent data

export type matchRoom = {
    userMap: Map<string, WSocket>;
};
const state: matchRoom = {
    userMap: new Map<string, WSocket>()
};
// Use state.userMap instead of userMap throughout your code
function addToken(token: string, socket: WSocket) {
    if (state.userMap.has(token))
        state.userMap.get(token)?.close();
    state.userMap.set(token, socket);
}
function removeToken(token: string) {
    state.userMap.delete(token);
}

export function getToken(token: string): WSocket | undefined {
    return state.userMap.get(token);
}

const SendUserToRoom = async (data: any) => {

    const { userId, roomId } = data;
    const token = await dbOperations.getSessionFromUserId(userId);
    console.log(state.userMap.keys());
    console.log('Token:', token);

    if (!token) {
        console.error('No token found');
        return;
    }

    const ws = getToken(token);

    if (!ws) {
        console.error('User not found in map');
        return;
    }

    ws.send(JSON.stringify(
        {
            event: 'sendToRoom',
            data: { roomId }
        } as SendToRoom
    ));
};

export function setupWaitingRoom(app: expressWs.Application) {
    app.ws('/finding-game', (ws, req) => {

        // TODO 
        const token = req.cookies.sessionToken;
        console.log("CONNECTION AND TOKEN", token);
        if (!token) {
            console.log('No token');
            ws.close();
            return;
        }
        addToken(token, ws);
        console.log('UserMap:', state.userMap);

        ws.on('close', () => {
            // remove from map
            console.log("REMOVING USER FROM MAP", token);
            removeToken(token);
        });
    });
}

eventEmitter.on('SendToRoom', SendUserToRoom);