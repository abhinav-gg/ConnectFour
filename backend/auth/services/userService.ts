import { User } from '@/models/User';
import { Tag } from '@/models/Tag';
import { AuthService } from './authService';
import { dbOperations } from '@/db/operations';

interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  rapid_elo?: number;
  blitz_elo?: number;
  bullet_elo?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface QueryResult<T> {
  rows: T[];
}

export class UserService {
  private authService: AuthService;
  private db: typeof dbOperations;

  constructor() {
    this.authService = new AuthService(this);
    this.db = dbOperations;
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT u.*, array_agg(t.name) as tags 
      FROM game_schema.users u
      LEFT JOIN game_schema.user_tags ut ON u.id = ut.user_id
      LEFT JOIN game_schema.tag t ON ut.tag_id = t.id
      WHERE u.id = $1
      GROUP BY u.id`;
    
    const result = await this.db.query<User>(query, [id]);
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT u.*, array_agg(t.name) as tags 
      FROM game_schema.users u
      LEFT JOIN game_schema.user_tags ut ON u.id = ut.user_id
      LEFT JOIN game_schema.tag t ON ut.tag_id = t.id
      WHERE u.email = $1
      GROUP BY u.id`;

    const result = await this.db.query<User>(query, [email]);
    return result[0] || null;
  }

  async create(userData: Partial<Omit<User, "id" | "tags">> & { username: string; email: string; password: string }): Promise<User> {
    const { username, email, password } = userData;
    const hashedPassword = this.authService.hashPassword(password);

    const query = `
      INSERT INTO game_schema.users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *`;

    const result = await this.db.query<User>(query, [username, email, hashedPassword]);
    return result[0];
  }

  async addTag(userId: string, tagName: string): Promise<void> {
    const query = `
      INSERT INTO game_schema.user_tags (user_id, tag_id)
      SELECT $1, id FROM game_schema.tag WHERE name = $2`;

    await this.db.query(query, [userId, tagName]);
  }

  async updateElo(userId: string, gameType: 'rapid' | 'blitz' | 'bullet', newElo: number): Promise<void> {
    const query = `
      UPDATE game_schema.users 
      SET ${gameType}_elo = $1 
      WHERE id = $2`;

    await this.db.query(query, [newElo, userId]);
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await dbOperations.query<User>(`
        SELECT u.*, array_agg(t.name) as tags 
        FROM game_schema.users u
        LEFT JOIN game_schema.user_tags ut ON u.id = ut.user_id
        LEFT JOIN game_schema.tag t ON ut.tag_id = t.id
        WHERE u.username = $1
        GROUP BY u.id`, 
        [username]
    );
    return users[0] || null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    
  }

  async createUser(userData: { email: string; password: string; name: string }) {
    const hashedPassword = await this.authService.hashPassword(userData.password);
    
    const query = `
      INSERT INTO game_schema.users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *`;

    const result = await this.db.query<QueryResult<User>>(query, [userData.name, userData.email, hashedPassword]);
    return result[0];
  }
}
