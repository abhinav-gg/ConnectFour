type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type RoomID = string;

type PlayerJoined = {
    event: 'playerJoined';
    data: { playersCount: number; };
};

export  type RoomFull = {
    event: 'roomFull';
};
  
export type GameStart = {
    event: 'gameStart';
    data: { player1: string; };
  };
  
export type PlayerDisconnected = {
    event: 'playerDisconnected';
    data: { playersCount: number; };
  };
  
export type MoveMade = {
  event: 'moveMade';
  data: { player: 0 | 1; col: number; };
};


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

export type Message = JoinGame | MakeMove | EndGame | PlayerJoined | RoomFull | GameStart | PlayerDisconnected | MoveMade;
