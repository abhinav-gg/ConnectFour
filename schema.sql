-- Create the schema
CREATE SCHEMA IF NOT EXISTS game_schema;

-- CockroachDB specific trigger for updated_at
CREATE OR REPLACE FUNCTION game_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE TABLE IF NOT EXISTS game_schema.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username STRING(50) NOT NULL,
    email STRING(255) NOT NULL,
    password_hash STRING(255) NOT NULL,
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

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON game_schema.users
    FOR EACH ROW
    EXECUTE FUNCTION game_schema.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON game_schema.events
    FOR EACH ROW
    EXECUTE FUNCTION game_schema.update_updated_at_column();

CREATE TABLE IF NOT EXISTS puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_solution STRING NOT NULL,
    starting_point STRING NOT NULL,
    predicted_rating INT,
    created_at TIMESTAMP DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT current_timestamp()
);

-- Create the same updated_at trigger for puzzles table
CREATE TRIGGER update_puzzles_updated_at
    BEFORE UPDATE ON puzzles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 

-- Relational table for Events and Games
CREATE TABLE IF NOT EXISTS game_schema.event_games (
    event_id UUID REFERENCES game_schema.events(id),
    game_id UUID REFERENCES game_schema.games(id),
    created_at TIMESTAMP DEFAULT current_timestamp(),
    PRIMARY KEY (event_id, game_id)
);

-- Create the publicOpenings database
CREATE DATABASE publicOpenings;

-- Create a read-only user for public access
GRANT CONNECT ON DATABASE publicOpenings TO readonly_user;

-- Create the table for storing openings
CREATE TABLE IF NOT EXISTS publicOpenings.openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position STRING UNIQUE NOT NULL,
    title STRING NOT NULL,
    description TEXT
);

-- Grant select permission to the readonly_user on the openings table
GRANT SELECT ON publicOpenings.openings TO readonly_user;

-- Create TimeControl table
CREATE TABLE IF NOT EXISTS game_schema.TimeControl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_time INT NOT NULL,
    increment INT NOT NULL,
    disadvantage INT
);