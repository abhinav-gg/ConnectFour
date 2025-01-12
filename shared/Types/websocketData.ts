

type PlayerJoined = {
    event: 'playerJoined';
    data: { playersCount: number; };
  };
  
  type RoomFull = {
    event: 'roomFull';
  };
  
  type GameStart = {
    event: 'gameStart';
    data: { player1: string; };
  };
  
  type PlayerDisconnected = {
    event: 'playerDisconnected';
    data: { playersCount: number; };
  };
  
  type MoveMade = {
    event: 'moveMade';
    data: { player: 0 | 1; col: number; };
  };
  