

export const JobKeys = {
  email: {
    queueName: 'emailQueue',
  },
  game_disconnect: {
    queueName: 'gameDisconnectQueue',
    stringId: (userId: string, gameId: string) => `${userId}:${gameId}`
  },
};
