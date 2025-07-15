import { EloChange, PlayerData } from "./game";
import { UUID } from "crypto";

export type RoomID = string;

/////////// SENT TO FRONTEND BY SERVER ///////////

export type GameStart = {
  event: 'gameStart';
  data: { 
    eloChanges: EloChange;
    playerNumber: number;
    players: PlayerData[] 
  }; // return the ordered list of players
};

export type PlayerDisconnected = {
  event: 'playerDisconnected';
  data: { playersCount: number; };
};

export type PlayerReconnected = {
  event: 'reconnection';
  data: { 
    eloChanges: EloChange;
    playerNumber: number;
    currentTurn: number;
    players: PlayerData[] 
    moves: number[]
  }
};

export type OpponentReconnect = {
  event: 'opponentReconnect';
  data: { playerNumber: number; };
};

export type PlayerTimeout = {
  event: 'playerTimeout';
  data: { };
};

export type MoveMade = {
  event: 'moveMade';
  data: { nextPlayer: number; col: number; timeLeft: number };
};

export type Draw = {
  event: 'draw';
  data: {  };
}

export type DrawOffer = {
  event: 'drawOffer';
  data: {  };
}

export type StartTimer = {
  event: 'startTimer';
};

export type PlayerJoined = {
  event: 'playerJoined';
  data: {   };
}

export type EndGame = {
  event: 'endGame';
  data: { draw: boolean; winner: number | null; message: string; };
};

export type Error = {
  event: 'error';
  data: { redirect: string | null; message: string; };
};

export type ReceiveMessage = {
  event: 'receiveMessage';
  data: { playerNumber: number; message: string; };
};


export type ClientMessage = GameStart | PlayerJoined | MoveMade | EndGame 
                          | GameStart | ReceiveMessage | Error | PlayerDisconnected 
                          | StartTimer | Draw | DrawOffer| PlayerTimeout | PlayerReconnected
                          | OpponentReconnect

/////////// SENT TO SERVER BY FRONTEND ///////////

export type ResponseError = {
  event: 'error';
  data: { message: string; };
};

export type OfferDraw = {
  event: 'offerDraw';
  data: { roomId: RoomID; };
};

export type AcceptDraw = {
  event: 'acceptDraw';
  data: { roomId: RoomID; };
};

export type Resign = {
  event: 'resign';
  data: { roomId: RoomID; };
};

export type OfferRematch = {
  event: 'offerRematch';
  data: { roomId: RoomID; };
};

export type JoinGame = {
  event: 'joinGame';
  data: { roomId: RoomID; };
};

export type MakeMove = {
  event: 'makeMove';
  data: { roomId: RoomID; col: number; };
};

export type PlayerTimeOut = {
  event: 'playerTimeOut';
  data: { roomId: RoomID; };
}

export type OpponentAbandoned = {
  event: 'opponentAbandoned';
  data: { roomId: RoomID; };
}

export type SendMessage = {
  event: 'sendMessage';
  data: { roomId: RoomID; message: string; };
};

export type ServerMessage = ResponseError | OfferDraw | AcceptDraw | Resign
                          | OfferRematch | JoinGame | MakeMove | PlayerTimeOut | SendMessage
                          | OpponentAbandoned;

export interface ChatMessage {
    playerNumber: number;
    username: string;
    message: string;
    isAnnouncement: boolean;
}

