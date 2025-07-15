import { TimeControl } from "@shared/types/game";

// 5 bytes = 40 bits
export function packTimeControl(t: TimeControl): Buffer {
    if (t.base_time < 0 || t.base_time > 900) throw new Error("Invalid baseTime");
    if (t.increment < 0 || t.increment > 255) throw new Error("Invalid increment");
    if (t.disadvantage < 0 || t.disadvantage > 300) throw new Error("Invalid disadvantage");
  
    let packed = 0n;
    packed |= BigInt(t.base_time) << 22n;      // 10 bits
    packed |= BigInt(t.increment) << 14n;     // 8 bits
    packed |= BigInt(t.disadvantage) << 5n;   // 9 bits
  
    const buf = Buffer.alloc(5);
    for (let i = 0; i < 5; i++) {
      buf[4 - i] = Number((packed >> BigInt(i * 8)) & 0xFFn);
    }
    return buf;
}
  
export function unpackTimeControl(buf: Buffer): TimeControl {
    if (buf.length !== 5) throw new Error("Invalid buffer length");
  
    let packed = 0n;
    for (let i = 0; i < 5; i++) {
      packed = (packed << 8n) | BigInt(buf[i]);
    }
  
    return {
      base_time: Number((packed >> 22n) & 0x3FFn),       // 10 bits
      increment: Number((packed >> 14n) & 0xFFn),       // 8 bits
      disadvantage: Number((packed >> 5n) & 0x1FFn),    // 9 bits
    };
}
  
export function packGameInfo(
        modeId: number,
        t: TimeControl
    ): Buffer {
    if (modeId < 0 || modeId > 0xFFFFFFFF) throw new Error("Invalid modeId");
  
    const timeControlBuf = packTimeControl(t);
    const buf = Buffer.alloc(9); // 5 bytes time control + 4 bytes modeId
  
    timeControlBuf.copy(buf, 0);
  
    buf.writeUInt32BE(modeId, 5); // append modeId at end
    return buf;
}
  
export function unpackGameInfo(buf: Buffer): {
    base_time: number;
    increment: number;
    disadvantage: number;
    modeId: number;
} {
    if (buf.length !== 9) throw new Error("Invalid buffer length");

    const timeControl = unpackTimeControl(buf.subarray(0, 5));
    const modeId = buf.readUInt32BE(5);

    return { ...timeControl, modeId };
}


