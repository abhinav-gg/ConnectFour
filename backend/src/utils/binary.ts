import { TimeControl } from "@shared/types/game";
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
        modeId: number,
        t: TimeControl
    ): Buffer {
    if (modeId < 0 || modeId > 0xFFFFFFFF) throw new Error("Invalid modeId");
  
    const timeControlBuf = timeControlToBuffer(t);
    const buf = Buffer.alloc(8); // 5 bytes time control + 4 bytes modeId
  
    timeControlBuf.copy(buf, 0);
  
    buf.writeUInt32BE(modeId, 4); // append modeId at end
    return buf;
}
  
export function unpackGameInfo(buf: Buffer): {
    base_time: number;
    increment: number;
    disadvantage: number;
    modeId: number;
} {
    if (buf.length !== 8) throw new Error("Invalid buffer length");

    const timeControl = bufferToTimeControl(buf.subarray(0, 4));
    const modeId = buf.readUInt32BE(4);

    return { ...timeControl, modeId };
}

