
export const FriendlyNoEventGameMode = 'cd3eac8a-4a65-425e-8e0e-fda476f0d2b5';

export const StandardTimecontrols = [
    { id: 'rapid2', label: 'Rapid', base: 5, increment: 2, disadvantage: 25 },
    { id: 'blitz2', label: 'Blitz', base: 3, increment: 2, disadvantage: 15 }
];

export const StandardGameStates = {
    scheduled: 'scheduled',
    ongoing: 'ongoing',
    draw: 'draw'
}

export const AvgGameLength = 30;

export const StandardStartingElo = 1000;

export const StandardStartingRatingDeviation = 350;

export const StandardReconnectionTime = 15 * 1000; // 15 seconds

export type StandardTimeCategories = "hyper-bullet" | "bullet" | "blitz" | "rapid";

export const StandardGameModes = {
    standard: {
        bullet: 'standard-bullet',
        blitz: 'standard-blitz',
        rapid: 'standard-rapid'
    },
    friendly: 'friendly'
}
