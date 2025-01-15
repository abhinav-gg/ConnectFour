
export const StandardNoEventGameMode = 'b7a10a0d-2ff0-4601-b1b5-c920870c297d';

export const FriendlyNoEventGameMode = 'cd3eac8a-4a65-425e-8e0e-fda476f0d2b5';

export const StandardGamemodes = [
    { id: 'blitz', label: 'Blitz', base: 5, increment: 0, disadvantage: 20 },
    { id: 'blitz2', label: 'Blitz', base: 3, increment: 2, disadvantage: 15 },
    { id: 'rapid', label: 'Rapid', base: 10, increment: 0, disadvantage: 30 },
    { id: 'rapid2', label: 'Rapid', base: 5, increment: 2, disadvantage: 25 },
    { id: 'bullet2', label: 'Bullet', base: 2, increment: 0, disadvantage: 10 },
    { id: 'bullet3', label: 'Bullet', base: 1, increment: 1, disadvantage: 5 },
];

export const StandardGameStates = {
    scheduled: 'scheduled',
    ongoing: 'ongoing',
    draw: 'draw'
}

