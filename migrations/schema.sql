CREATE SCHEMA IF NOT EXISTS con4_schema;

CREATE TABLE IF NOT EXISTS con4_schema.Users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  username VARCHAR(32) UNIQUE,
  password_hash VARCHAR(196),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS con4_schema.UTags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE
); -- may later have assignedBy etc

INSERT INTO con4_schema.UTags (name) VALUES
  ('IM'),     -- International Master
  ('GM'),     -- Grandmaster
  ('Streamer'), -- Streamer tag
  ('Premium'), -- Premium tier user
  ('Admin')   -- Administrator
ON CONFLICT DO NOTHING;


CREATE TABLE IF NOT EXISTS con4_schema.UserTags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES con4_schema.Users(id),
  tag_id UUID REFERENCES con4_schema.UTags(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS con4_schema.GamePlayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES con4_schema.Games(id),
  player_number INT NOT NULL,
  player UUID NULL REFERENCES con4_schema.Users(id),
  elo_change FLOAT NOT NULL DEFAULT 0, -- the change in elo for the player
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (game_id, player_number)
);
--------------------------------------------

CREATE TABLE IF NOT EXISTS con4_schema.Events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_participants INT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES con4_schema.Users(id)
);

CREATE TABLE IF NOT EXISTS con4_schema.EventParticipants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES con4_schema.Events(id),
  user_id UUID NOT NULL REFERENCES con4_schema.Users(id),
  created_at TIMESTAMP DEFAULT now() -- use for the time they signed up
);

CREATE TABLE IF NOT EXISTS con4_schema.GameModes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO con4_schema.GameModes (name) VALUES -- Things we want leaderboards for
  ('ranked-bullet'),
  ('ranked-blitz'),
  ('ranked-rapid'),
  ('casual')
ON CONFLICT DO NOTHING;
  

CREATE TABLE IF NOT EXISTS con4_schema.Elo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player UUID NOT NULL REFERENCES con4_schema.users(id) ON DELETE CASCADE, -- if user is deleted, their elo is gone
  mode UUID NOT NULL REFERENCES con4_schema.GameModes(id),
  elo FLOAT NOT NULL CHECK (elo > 0), -- no default as it varies
  updated_at TIMESTAMP DEFAULT now() NOT NULL, -- used for analytics
  UNIQUE (player, mode)
);

CREATE TABLE IF NOT EXISTS con4_schema.GameInfo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gamemode UUID NOT NULL REFERENCES con4_schema.GameModes(id),
  base_time INT NOT NULL,
  increment INT NOT NULL DEFAULT 0,
  disadvantage INT NOT NULL DEFAULT 0,
  UNIQUE (gamemode)
);

CREATE TABLE IF NOT EXISTS con4_schema.puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_solution VARCHAR NOT NULL,
  predicted_rating INT,
  created_at TIMESTAMP DEFAULT now()
);

-- Hide the shitshow
-- CREATE TABLE IF NOT EXISTS events_schema.ICHack25 (
--   id VARCHAR(64) PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES con4_schema.Users(id),
--   discord_id VARCHAR(50) NOT NULL,
--   full_name VARCHAR(100) NOT NULL,
--   hackspace events_schema.hackspace NOT NULL
-- );

