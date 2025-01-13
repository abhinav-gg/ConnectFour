type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type RoomID = string;

/////////// SENT TO FRONTEND BY SERVER ///////////


export  type RoomFull = {
    event: 'roomFull';
};
  
export type GameStart = {
    event: 'gameStart';
    data: { opponentName: string; player: 0 | 1; opponentElo: number; };
  };
  
export type PlayerDisconnected = {
  event: 'playerDisconnected';
  data: { playersCount: number; };
};
  
export type MoveMade = {
  event: 'moveMade';
  data: { player: 0 | 1; col: number; };
};

/////////// SENT TO SERVER BY FRONTEND ///////////

export type JoinGame = {
  event: 'joinGame';
  data: { roomId: RoomID; userId: UUID; };
};

export type MakeMove = {
  event: 'makeMove';
  data: { roomId: RoomID; col: number; };
};

export type EndGame = {
  event: 'endGame';
  data: { roomId: RoomID; };
};

export type Error = {
  event: 'error';
  data: { message: string; };
};

export type Message = JoinGame | MakeMove | EndGame | RoomFull | GameStart | PlayerDisconnected | MoveMade;

