

export const JobKeys = {
  email: {
    queueName: 'emailQueue',
    stringId: (email: string, time: string) => `${email}:${time}`
  },
  game_disconnect: {
    queueName: 'gameDisconnectQueue',
    stringId: (userId: string, gameId: string) => `${userId}:${gameId}`
  },
  game_timeout: {
    queueName: 'gameTimeoutQueue',
    stringId: (userId: string, gameId: string) => `${gameId}`
  },
};
