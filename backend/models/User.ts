import { Tag } from './Tag';

export interface User {
    id: string;
    username: string;
    email: string;
    rapid_elo: number;
    blitz_elo: number;
    bullet_elo: number;
    created_at: string;
    updated_at: string;
    last_login: string | null;
    tags?: Tag[];

    toSafeObject(): {
        id: string;
        username: string;
        email: string;
        rapid_elo: number;
        blitz_elo: number;
        bullet_elo: number;
    };
}

export interface UserWithPassword extends User {
    password_hash: string;
} 