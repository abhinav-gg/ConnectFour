import { Socket } from "socket.io";
import { withNamespace } from "../handlers";
import { liveGameService } from "@/services/livegame.service";
import { getIdentityFromSocket } from "@/lib/game.middleware";
import { GameContext } from "@/utils/gameContext";
import { RoomSchema } from "../socketRoomSchema";


async function handleDisconnectSocket(socket: Socket) {
    try {
        const userId = getIdentityFromSocket(socket);
        if (!userId) {
            console.warn('User identity not found on disconnect');
            return;
        }

        // Create fresh GameContext at socket level
        const gameContext = new GameContext(userId);
        const metadata = await gameContext.getMetadata();
        if (metadata && metadata.shortcode) {
            socket.leave(RoomSchema.game.key(metadata.shortcode));
            socket.leave(RoomSchema.spectating.key(metadata.shortcode));
        }

        await liveGameService.handleDisconnect(gameContext);

    } catch (error) {
        console.error('Error handling disconnect:', error);
    }
}


// Register game-related handlers
export function registerGameHandlers(sock: Socket) {

    const socket = withNamespace(sock, 'game');

    // Handle disconnect and leave events using the same handler
    const disconnectHandler = async () => {
        await handleDisconnectSocket(socket);
    };

    sock.on('disconnect', disconnectHandler);
    socket.on('leave', disconnectHandler);

    // Game chat handling
    socket.on('chat', async (data) => {
        try {
            console.log('Game chat received:', data);
            const { shortcode, message} = data;
            const userId = getIdentityFromSocket(socket);
            if (!userId) {
                socket.emit('error', { message: 'User identity required' });
                return;
            }

            // Create fresh GameContext at socket level
            const gameContext = await GameContext.fromShortcode(userId, shortcode);
            await liveGameService.HandleChatMessage(gameContext, message);

        } catch (error) {
            console.error('Error handling game chat:', error);
            socket.emit('error', { message: 'Failed to process CHAT' });
        }
    });
    
    
    // Game move handling
    socket.on('move', async (data) => {
        try {
            console.log('Game move received:', data);
            const { shortcode, move } = data;
            const userId = getIdentityFromSocket(socket);
            if (!userId) {
                socket.emit('error', { message: 'User identity required' });
                return;
            }

            // Create fresh GameContext at socket level
            const gameContext = await GameContext.fromShortcode(userId, shortcode);
            const attemptedMove = await liveGameService.HandleGameMove(gameContext, move);

            if (attemptedMove.status !== 200) {
                socket.emit('error', { message: attemptedMove.message });
                return;
            }

        } catch (error) {
            console.error('Error handling game move:', error);
            socket.emit('error', { message: 'Failed to process game move' });
        }
    });

    // Resign game
    socket.on('resign', async (data) => {
        try {
            const { shortcode } = data;
            const userId = getIdentityFromSocket(socket);
            if (!userId) {
                socket.emit('error', { message: 'User identity required' });
                return;
            }

            console.log(`User ${socket.id} ATTEMPTED TO RESIGN from game ${shortcode}`);
            
            // Create fresh GameContext at socket level to handle resignation
            const gameContext = await GameContext.fromShortcode(userId, shortcode);
            await liveGameService.Resign(gameContext);
            
            // socket.emit('left_game', { gameId });
        } catch (error) {
            console.error('Error handling resignation:', error);
            socket.emit('error', { message: 'Failed to resign from game' });
        }
    });


    // Draw offer
    socket.on('draw_offer', async (data) => {
        try {
            const { shortcode } = data;
            const userId = getIdentityFromSocket(socket);
            if (!userId) {
                socket.emit('error', { message: 'User identity required' });
                return;
            }

            // Create fresh GameContext at socket level for draw offer
            const gameContext = await GameContext.fromShortcode(userId, shortcode);
            const response = await liveGameService.HandleDrawOffer(gameContext);
            
            if (response.status !== 200) {
                socket.emit('error', { message: response.message });
            }
        } catch (error) {
            console.error('Error handling draw offer:', error);
            socket.emit('error', { message: 'Failed to handle draw offer' });
        }
    });

    // Draw accept
    socket.on('draw_accept', async (data) => {
        try {
            const { shortcode } = data;
            const userId = getIdentityFromSocket(socket);
            if (!userId) {
                socket.emit('error', { message: 'User identity required' });
                return;
            }

            // Create fresh GameContext at socket level for draw acceptance
            const gameContext = await GameContext.fromShortcode(userId, shortcode);
            await liveGameService.HandleDraw(gameContext);
            
        } catch (error) {
            console.error('Error accepting draw:', error);
            socket.emit('error', { message: 'Failed to accept draw' });
        }
    });




}


