-- Create the schema
CREATE SCHEMA IF NOT EXISTS game_schema;

-- Users table
CREATE TABLE IF NOT EXISTS game_schema.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username STRING(50) NOT NULL,
    email STRING(255) NOT NULL,
    password_hash STRING(255) NOT NULL,
    rapid_elo INT DEFAULT 1000,
    blitz_elo INT DEFAULT 1000,
    bullet_elo INT DEFAULT 1000,
    created_at TIMESTAMP DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT current_timestamp(),
    last_login TIMESTAMP,
    UNIQUE(username),
    UNIQUE(email)
);

-- Tags table (lookup table)
CREATE TABLE IF NOT EXISTS game_schema.tag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING(50) NOT NULL,
    UNIQUE(name)
);

-- Relational table for Users and Tags
CREATE TABLE IF NOT EXISTS game_schema.user_tags (
    user_id UUID REFERENCES game_schema.users(id),
    tag_id UUID REFERENCES game_schema.tag(id),
    created_at TIMESTAMP DEFAULT current_timestamp(),
    PRIMARY KEY (user_id, tag_id)
);

-- Insert default tags
INSERT INTO game_schema.tag (name) VALUES 
    ('IM'),     -- International Master
    ('GM'),     -- Grandmaster
    ('Admin');  -- Administrator

-- Events table
CREATE TABLE IF NOT EXISTS game_schema.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title STRING(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    event_type STRING(50) NOT NULL,
    max_participants INT,
    current_participants INT DEFAULT 0,
    status STRING(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT current_timestamp(),
    created_by UUID REFERENCES game_schema.users(id)
);

-- Games table
CREATE TABLE IF NOT EXISTS game_schema.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES game_schema.users(id),
    player2_id UUID NOT NULL REFERENCES game_schema.users(id),
    moves TEXT,  -- Store the game moves as a string
    time_control_minutes INT NOT NULL,
    time_control_increment INT NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    winner_id UUID REFERENCES game_schema.users(id),
    created_at TIMESTAMP DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT current_timestamp()
);

-- Add the update trigger for games table
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON game_schema.games
    FOR EACH ROW
    EXECUTE FUNCTION game_schema.update_updated_at_column(); 
-- CockroachDB specific trigger for updated_at
CREATE OR REPLACE FUNCTION game_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON game_schema.users
    FOR EACH ROW
    EXECUTE FUNCTION game_schema.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON game_schema.events
    FOR EACH ROW
    EXECUTE FUNCTION game_schema.update_updated_at_column();
