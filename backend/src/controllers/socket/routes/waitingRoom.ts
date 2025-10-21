import { Socket } from "socket.io";
import { withNamespace } from "../handlers";
import { liveGameService } from "@/services/livegame.service";
import { getIdentityFromSocket } from "@/lib/middleware/game.middleware";
import { GameContext } from "@/utils/gameContext";
import { RoomSchema } from "../socketRoomSchema";
import { gameService } from "@/services/game.service";


// Register game-related handlers
export function registerGameHandlers(socket: Socket) {

    // Game chat handling
    socket.on('me', async (data) => {
        try {
            const userId = getIdentityFromSocket(socket);
            if (!userId) {
                socket.emit('error', { message: 'User identity required' });
                return;
            }

            // Create fresh GameContext at socket level
            const gameContext = new GameContext(userId);
            const resp = await gameService.assertUserGame(gameContext);
            if (resp.status !== 200) {
                socket.emit('status', { gamelink: `/game?r=${resp.message}` });
                return;
            }

        } catch (error) {
            console.error('Error handling game chat:', error);
            socket.emit('error', { message: 'Failed to process CHAT' });
        }
    });



}


