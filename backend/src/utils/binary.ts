import { GameInfo, TimeControl } from "@shared/types/game.types";
import { UUID } from "crypto";

// Helper to create binary keys
export function keyWithPrefix(prefix: string, bufferData: Buffer): Buffer {
    return Buffer.concat([Buffer.from(prefix, 'utf8'), bufferData]);
}
  
// Example: convert UUID to Buffer (16 bytes)
export function uuidToBuffer(uuid: string): Buffer {
    return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

// Convert Buffer back to UUID string
export function bufferToUuid(buf: Buffer): UUID {
    const hex = buf.toString('hex');
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20)
    ].join('-') as UUID;
}

export function timeControlToBuffer (timeControl: TimeControl): Buffer {
    // push the time control values into a buffer: 2 bytes for base_time, 1 byte for increment, 1 byte for disadvantage
    const buffer = Buffer.alloc(4);
    buffer.writeUInt16BE(timeControl.base_time, 0);      // 2 bytes for base_time 
    buffer.writeUInt8(timeControl.increment, 2);         // 1 byte for increment
    buffer.writeUInt8(timeControl.disadvantage, 3);      // 1 byte for disadvantage
    return buffer;
}

export function bufferToTimeControl(buffer: Buffer): TimeControl {
    if (buffer.length !== 4) {
        throw new Error("Invalid buffer length for TimeControl");
    }
    return {
        base_time: buffer.readUInt16BE(0),      // 2 bytes for base_time
        increment: buffer.readUInt8(2),         // 1 byte for increment
        disadvantage: buffer.readUInt8(3)       // 1 byte for disadvantage
    };
}

export function packGameInfo(
        gameinfo: GameInfo
    ): Buffer {

    const { time_control, gamemode } = gameinfo;

    if (gamemode < 0 || gamemode > 0xFFFFFFFF) throw new Error("Invalid gamemode");

    const timeControlBuf = timeControlToBuffer(time_control);
    const buf = Buffer.alloc(8); // 5 bytes time control + 4 bytes modeId
  
    timeControlBuf.copy(buf, 0);

    buf.writeUInt32BE(gamemode, 4); // append gamemode at end
    return buf;
}
  
export function unpackGameInfo(buf: Buffer): GameInfo {
    if (buf.length !== 8) throw new Error("Invalid buffer length");

    const time_control = bufferToTimeControl(buf.subarray(0, 4));
    const gamemode = buf.readUInt32BE(4);

    return { time_control, gamemode } as GameInfo;
}

export function packStandardGameData(moves: number[], deltaTimes: number[]) {
    // verify all moves fit in 3 bits and all deltaTimes fit in 21 bits
    if (!moves.every(m => m >= 0 && m < 8)) {
        throw new Error("There Is An Invalid move");
    }
    if (!deltaTimes.every(d => d >= 0 && d < 2 ** 21)) {
        throw new Error("There Is An Invalid deltaTime");
    }
    if (deltaTimes.length !== moves.length - 1) {
        throw new Error("Invalid deltaTime length");
    }

    const bufferArray: Buffer[] = [];
    // start by adding a move then add a deltatime then a move. 

    // Use a bit buffer to pack moves (3 bits) and deltaTimes (21 bits) efficiently
    let bitBuffer = 0;
    let bitCount = 0;
    const output: number[] = [];

    function flushBits() {
        while (bitCount >= 8) {
            output.push((bitBuffer >> (bitCount - 8)) & 0xFF);
            bitCount -= 8;
        }
    }

    for (let i = 0; i < moves.length; i++) {
        // Add move (3 bits)
        bitBuffer = (bitBuffer << 3) | (moves[i] & 0x7);
        bitCount += 3;
        flushBits();

        // Add deltaTime (21 bits) if not last move
        if (i < moves.length - 1) {
            bitBuffer = (bitBuffer << 21) | (deltaTimes[i] & 0x1FFFFF);
            bitCount += 21;
            flushBits();
        }
    }

    // Flush any remaining bits (pad with zeros on the right)
    if (bitCount > 0) {
        output.push((bitBuffer << (8 - bitCount)) & 0xFF);
    }

    bufferArray.push(Buffer.from(output));

    return Buffer.concat(bufferArray);
}

export function unpackStandardGameData(buffer: Buffer): { moves: number[], deltaTimes: number[] } {
    // Unpack the buffer into moves (3 bits each) and deltaTimes (21 bits each)
    const moves: number[] = [];
    const deltaTimes: number[] = [];
    let bitBuffer = 0;
    let bitCount = 0;
    let byteIdx = 0;

    // Helper to ensure we have enough bits in the buffer
    function ensureBits(n: number) {
        while (bitCount < n && byteIdx < buffer.length) {
            bitBuffer = (bitBuffer << 8) | buffer[byteIdx++];
            bitCount += 8;
        }
    }

    // At least one move is always present
    while (true) {
        // Read move (3 bits)
        ensureBits(3);
        if (bitCount < 3) break; // No more data
        const move = (bitBuffer >> (bitCount - 3)) & 0x7;
        moves.push(move);
        bitCount -= 3;

        // Try to read deltaTime (21 bits)
        ensureBits(21);
        if (bitCount < 21) break; // No more deltaTimes, done
        const deltaTime = (bitBuffer >> (bitCount - 21)) & 0x1FFFFF;
        deltaTimes.push(deltaTime);
        bitCount -= 21;
    }

    // Verification: deltaTimes.length === moves.length - 1
    if (deltaTimes.length !== moves.length - 1) {
        throw new Error("Invalid packed data: deltaTimes length mismatch");
    }
    // Verification: all moves in [0,7], all deltaTimes in [0,2^21)
    if (!moves.every(m => m >= 0 && m < 8)) {
        throw new Error("Invalid move value in packed data");
    }
    if (!deltaTimes.every(d => d >= 0 && d < 2 ** 21)) {
        throw new Error("Invalid deltaTime value in packed data");
    }

    return { moves, deltaTimes };
}