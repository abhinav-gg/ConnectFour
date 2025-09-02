// // store/MarkdownStore.ts
// import { promises as fs } from 'fs';

// const DATA_PATH = './data/opening-book.json';

// type RawMap = Record<string, string>;

// function mapToRaw(map: Map<bigint, string>): RawMap {
//   const obj: RawMap = {};
//   for (const [k, v] of map) {
//     obj[k.toString()] = v;
//   }
//   return obj;
// }

// function rawToMap(obj: RawMap): Map<bigint, string> {
//   const map = new Map<bigint, string>();
//   for (const [k, v] of Object.entries(obj)) {
//     map.set(BigInt(k), v);
//   }
//   return map;
// }

// class MarkdownStore {
//   private map = new Map<bigint, string>();
//   private static instance: MarkdownStore | null = null;

//   private constructor() {}

//   static getInstance(): MarkdownStore {
//     if (!this.instance) {
//       this.instance = new MarkdownStore();
//     }
//     return this.instance;
//   }


//   async load(): Promise<void> {
//     try {
//       const json = await fs.readFile(DATA_PATH, 'utf8');
//       this.map = rawToMap(JSON.parse(json));
//     } catch (err: any) {
//       if (err.code === 'ENOENT') {
//         await this.persist(); // initialize blank file
//       } else {
//         throw err;
//       }
//     }
//   }

//   private async persist(): Promise<void> {
//     const raw = mapToRaw(this.map);
//     const tmp = `${DATA_PATH}.tmp`;
//     await fs.writeFile(tmp, JSON.stringify(raw, null, 2), 'utf8');
//     await fs.rename(tmp, DATA_PATH);
//   }

//   get(key: bigint): string | undefined {
//     return this.map.get(key);
//   }

//   async set(key: bigint, content: string): Promise<void> {
//     this.map.set(key, content);
//     await this.persist();
//   }

//   async delete(key: bigint): Promise<void> {
//     this.map.delete(key);
//     await this.persist();
//   }

//   async exportAll(filePath: string): Promise<void> {
//     const raw = mapToRaw(this.map);
//     await fs.writeFile(filePath, JSON.stringify(raw, null, 2), 'utf8');
//   }

//   async importAll(filePath: string): Promise<void> {
//     const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as RawMap;
//     this.map = rawToMap(raw);
//     await this.persist();
//   }
// }

// const store = MarkdownStore.getInstance()

// export const OpeningManager = {
//     initStore: () => store.load(),
//     getOpening: (key: bigint) => store.get(key),
//     setOpening: (k: bigint, c: string) => store.set(k, c),
//     dropOpening: (k: bigint) => store.delete(k),
//     saveOpenings: () => store.exportAll(DATA_PATH),
// }
