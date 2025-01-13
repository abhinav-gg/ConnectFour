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

INSERT INTO con4_schema.UTags (name) VALUES
  ('IM'),     -- International Master
  ('GM'),     -- Grandmaster
  ('Admin')   -- Administrator
ON CONFLICT DO NOTHING;


CREATE TABLE IF NOT EXISTS con4_schema.UserTags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES con4_schema.Users(id),
  tag_id UUID REFERENCES con4_schema.UTags(id),
  created_at TIMESTAMP DEFAULT now()
);

----------------------------------------------


CREATE TABLE IF NOT EXISTS con4_schema.TimeControls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_time INT NOT NULL,
  increment INT NOT NULL,
  disadvantage INT NOT NULL DEFAULT 0,
  UNIQUE (base_time, increment, disadvantage)
);

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

-- a game is between two players and is created when both players have joined
CREATE TABLE IF NOT EXISTS con4_schema.Games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1 UUID NOT NULL REFERENCES Users(id), -- also known as red
  player2 UUID NOT NULL REFERENCES Users(id), -- also known as yellow
  time_control UUID NOT NULL REFERENCES TimeControls(id),
  state UUID NOT NULL REFERENCES GameStates(id), -- a game must always have a state
  last_move UUID REFERENCES Moves(id) -- for fast reference, can be null
  board STRING(42) NOT NULL; -- a string representation of the board
  created_at TIMESTAMP DEFAULT now(),
);

CREATE TABLE IF NOT EXISTS con4_schema.Moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES Games(id),
  player_id UUID NOT NULL REFERENCES Users(id),
  move INT NOT NULL CHECK (move >= 0 AND move < 7),
  played_at TIMESTAMP DEFAULT now(),
  delta FLOAT NOT NULL, -- time taken to make the move since the last move
  created_at TIMESTAMP DEFAULT now() -- Add created_at for tracking
);

-- Note: You will need to call this function from your application code
-- when inserting a new move to set the move number correctly.

CREATE TABLE IF NOT EXISTS con4_schema.FindingGame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player UUID NOT NULL REFERENCES Users(id),
  time_control UUID NOT NULL REFERENCES TimeControls(id),
  searching_at TIMESTAMP DEFAULT now()
);




-- Create an index to find ongoing games

CREATE INDEX IF NOT EXISTS idx_find_ongoing_games 
ON con4_schema.Games (player1, player2, state) 
WHERE state = (SELECT id FROM con4_schema.GameStates WHERE state = 'ongoing');

------------------------------------------------------

CREATE TABLE IF NOT EXISTS con4_schema.Events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title STRING(100) NOT NULL,
  description TEXT,
  start TIMESTAMP NOT NULL,
  end TIMESTAMP NOT NULL,
  event_type STRING(50) NOT NULL,
  max_participants INT,
  current_participants INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS con4_schema.GameModes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING(50) NOT NULL UNIQUE
);

INSERT INTO con4_schema.GameModes (name) VALUES
  ('bullet'),
  ('blitz'),
  ('rapid')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS con4_schema.Elo (
  id UUID PRIMARY KEY DEFAULT
  player UUID NOT NULL REFERENCES Users(id),
  mode UUID NOT NULL REFERENCES GameModes(id),
  elo INT NOT NULL -- no default as it varies
);

CREATE TABLE IF NOT EXISTS con4_schema.ModeTimeControls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode UUID NOT NULL REFERENCES GameModes(id),
  time_control UUID NOT NULL REFERENCES TimeControls(id)
  UNIQUE (mode, time_control)
);




----------------------------------------------------


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