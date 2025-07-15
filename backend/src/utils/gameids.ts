
import { UUID } from "crypto";

// Convert UUID string to Buffer (16 bytes)



export function uuidToBuffer(uuid: UUID): Buffer {
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



// import { randomUUID } from 'crypto';

// // 1. Generate UUID string
// const uuidStr = randomUUID();
// console.log('UUID String:', uuidStr);

// // 2. Convert to Buffer (16 bytes)
// const uuidBuf = uuidToBuffer(uuidStr);
// console.log('UUID Buffer:', uuidBuf);

// // 3. Store uuidBuf in DynamoDB as binary attribute

// // 4. Convert back to string when reading
// const uuidStrBack = bufferToUuid(uuidBuf);
// console.log('Recovered UUID String:', uuidStrBack);


