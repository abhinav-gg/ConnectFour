CREATE SCHEMA IF NOT EXISTS con4_schema;

CREATE TABLE IF NOT EXISTS con4_schema.Users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email STRING(255) UNIQUE,
  email_verified BOOL DEFAULT FALSE,
  username STRING(32) UNIQUE,
  password_hash STRING(196),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login TIMESTAMP,
  is_anonymous BOOL
);

CREATE TABLE IF NOT EXISTS con4_schema.UTags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING(50) NOT NULL UNIQUE
);

INSERT INTO UTags (name) VALUES
  ('IM'),     -- International Master
  ('GM'),     -- Grandmaster
  ('Admin')   -- Administrator
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS con4_schema.GameStates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state STRING(42) NOT NULL UNIQUE
);

INSERT INTO GameStates (state) VALUES
  ('ongoing'),
  ('draw'),
  ('p1_won'),
  ('p2_won')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS con4_schema.TimeControls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_time INT NOT NULL,
  increment INT NOT NULL,
  disadvantage INT NOT NULL DEFAULT 0,
  UNIQUE (base_time, increment, disadvantage)
);

CREATE TABLE IF NOT EXISTS con4_schema.UserTags (
  user_id UUID REFERENCES Users(id),
  tag_id UUID REFERENCES UTags(id),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);

-- a game is between two players and is created when both players have joined
CREATE TABLE IF NOT EXISTS con4_schema.Games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1 UUID NOT NULL REFERENCES Users(id),
  player2 UUID NOT NULL REFERENCES Users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  time_control UUID NOT NULL REFERENCES TimeControls(id),
  state UUID NOT NULL REFERENCES GameStates(id), -- a game must always have a state
  winner UUID REFERENCES Users(id), -- allow null for ongoing or draw
  board STRING(42) NOT NULL, -- 0=empty, 1=p1, 2=p2
  turn UUID NOT NULL REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS con4_schema.Moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES Games(id),
  player_id UUID NOT NULL REFERENCES Users(id),
  move INT NOT NULL CHECK (move >= 0 AND move < 42),
  created_at TIMESTAMP DEFAULT now(),
  delta FLOAT NOT NULL, -- time taken to make the move
  is_check BOOL NOT NULL DEFAULT FALSE,
  is_winning_move BOOL NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS con4_schema.Events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title STRING(100) NOT NULL,
  description TEXT,
  start TIMESTAMP NOT NULL,
  end TIMESTAMP NOT NULL,
  event_type STRING(50) NOT NULL,
  max_participants INT,
  current_participants INT DEFAULT 0,
  status STRING(20) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS con4_schema.puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_solution STRING NOT NULL,
  starting_point STRING NOT NULL,
  predicted_rating INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

/*
CREATE OR REPLACE FUNCTION con4_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE PLpgSQL;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON con4_schema.games
  FOR EACH ROW
  EXECUTE FUNCTION con4_schema.update_updated_at_column(); 

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON con4_schema.users
  FOR EACH ROW
  EXECUTE FUNCTION con4_schema.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON con4_schema.events
  FOR EACH ROW
  EXECUTE FUNCTION con4_schema.update_updated_at_column();

CREATE TRIGGER update_puzzles_updated_at
  BEFORE UPDATE ON con4_schema.puzzles
  FOR EACH ROW
  EXECUTE FUNCTION con4_schema.update_updated_at_column();
*/

-- Create the public openings database
CREATE DATABASE IF NOT EXISTS openings;

-- Grant select permission to the readonly_user on the openings table
-- GRANT SELECT ON openings.openings TO readonly_user; -- why?

CREATE TABLE IF NOT EXISTS openings.OpeningDescription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS openings.Opening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position STRING UNIQUE NOT NULL,
  opening_description_id UUID REFERENCES openings.OpeningDescription(id)
);