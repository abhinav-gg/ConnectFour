import { Server } from "socket.io";

export function emitToRoom(io: Server, room: string, event: string, data: any) {
    io.to(room).emit(event, data);
}