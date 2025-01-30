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
  is_anonymous BOOL DEFAULT FALSE
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

CREATE TABLE IF NOT EXISTS con4_schema.Sessions (
  user_id UUID PRIMARY KEY REFERENCES con4_schema.Users(id),
  token STRING(32) NOT NULL,
  expires TIMESTAMP NOT NULL
);

----------------------------------------------


CREATE TABLE IF NOT EXISTS con4_schema.TimeControls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_time INT NOT NULL,
  increment INT NOT NULL,
  disadvantage INT NOT NULL DEFAULT 0,
  UNIQUE (base_time, increment, disadvantage)
);

-- a game is between two players and is created when both players have joined
CREATE TABLE IF NOT EXISTS con4_schema.Games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id STRING(8) NULL UNIQUE, -- a short id for the game,
  game_info UUID NOT NULL REFERENCES con4_schema.GameInfo(id),
  state STRING(100) NOT NULL, -- a game must always have a state
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS con4_schema.GamePlayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES con4_schema.Games(id),
  player UUID NOT NULL REFERENCES con4_schema.Users(id),
  player_number INT NOT NULL, -- can be higher than 2 in custom gamemodes
  elo_change FLOAT NOT NULL DEFAULT 0, -- the change in elo for the player
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (game_id, player_number)
);

CREATE TABLE IF NOT EXISTS con4_schema.Moves (
  game_id UUID NOT NULL REFERENCES con4_schema.Games(id),
  move INT NOT NULL CHECK (move >= 0), -- 42 moves in a game
  player UUID NOT NULL REFERENCES con4_schema.Users(id),
  col INT NOT NULL CHECK (col >= 0 AND col < 7),
  played_at TIMESTAMP DEFAULT now(),
  delta FLOAT NOT NULL, -- time taken to make the move since the last move
  PRIMARY KEY (game_id, move) -- Use a composite key to autogenerate the sql index to speed up queries
);

CREATE TABLE IF NOT EXISTS con4_schema.GameLookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player UUID NOT NULL REFERENCES con4_schema.Users(id) UNIQUE, -- the player may only have one game at a time
  game UUID NULL REFERENCES con4_schema.Games(id), -- NULL if the game is not ongoing
  game_info UUID NOT NULL REFERENCES con4_schema.GameInfo(id),
  created_at TIMESTAMP DEFAULT now()
);

------------------------------------------------------

CREATE TABLE IF NOT EXISTS con4_schema.Events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title STRING(100) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_participants INT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES con4_schema.Users(id)
);

CREATE TABLE IF NOT EXISTS con4_schema.EventParticipants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES con4_schema.events(id),
  user_id UUID NOT NULL REFERENCES con4_schema.users(id),
  created_at TIMESTAMP DEFAULT now() -- use for the time they signed up
);

CREATE TABLE IF NOT EXISTS con4_schema.GameModes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING(50) NOT NULL UNIQUE,
  event UUID NULL REFERENCES con4_schema.Events(id)
);

INSERT INTO con4_schema.GameModes (name) VALUES
  ('standard-bullet'),
  ('standard-blitz'),
  ('standard-rapid'),
  ('friendly')
ON CONFLICT DO NOTHING;

INSERT INTO con4_schema.TimeControls (base_time, increment, disadvantage) VALUES
  (10, 0, 30),
  (5, 2, 25),
  (5, 0, 20),
  (3, 2, 15),
  (2, 0, 10),
  (1, 1, 5)
ON CONFLICT DO NOTHING;

  

CREATE TABLE IF NOT EXISTS con4_schema.Elo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player UUID NOT NULL REFERENCES con4_schema.users(id),
  mode UUID NOT NULL REFERENCES con4_schema.GameModes(id),
  elo FLOAT NOT NULL CHECK (elo > 0), -- no default as it varies
  rating_deviation FLOAT NOT NULL CHECK (0 <= rating_deviation AND rating_deviation <= 350),
  updated_at TIMESTAMP DEFAULT now() NOT NULL, -- used for analytics
  UNIQUE (player, mode)
);

CREATE TABLE IF NOT EXISTS con4_schema.GameInfo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gamemode UUID NOT NULL REFERENCES con4_schema.GameModes(id),
  time_control UUID NOT NULL REFERENCES con4_schema.TimeControls(id),
  UNIQUE (gamemode, time_control)
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

CREATE TABLE IF NOT EXISTS con4_schema.ICHack25 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES con4_schema.Users(id),
  discord_id STRING(50) NOT NULL,
  full_name STRING(100) NOT NULL,
  hackspace ENUM('QTR', 'SCR', "JCR") NOT NULL
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