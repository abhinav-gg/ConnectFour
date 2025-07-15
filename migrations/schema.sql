CREATE SCHEMA IF NOT EXISTS con4_schema;

---------- Users ----------

CREATE TABLE IF NOT EXISTS con4_schema.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(128) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  username VARCHAR(32) UNIQUE,
  password_hash VARCHAR(128),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL, -- used for soft deletes
  last_login TIMESTAMP 
);

---------- User Tags ----------

CREATE TABLE IF NOT EXISTS con4_schema.user_tags (
  user_id UUID NOT NULL REFERENCES con4_schema.users(id),
  tag_name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, tag_name)
);

-- 1. Drop the existing CHECK constraint
ALTER TABLE con4_schema.user_tags
DROP CONSTRAINT IF EXISTS usertags_tag_name_check;

-- 2. Add the updated CHECK constraint with new tag options
ALTER TABLE con4_schema.user_tags
ADD CONSTRAINT usertags_tag_name_check
CHECK (
  tag_name IN ('GM', 'IM', 'Admin', 'Premium', 'Streamer', 'Tester')
);

---------- Game Modes ----------

-- CREATE TABLE IF NOT EXISTS con4_schema.game_info ( -- Things we want leaderboards for
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   gamemode VARCHAR(64) NOT NULL, -- see below
--   base_time INT NOT NULL,
--   increment INT NOT NULL DEFAULT 0,
--   disadvantage INT NOT NULL DEFAULT 0
-- ); -- > less than 16 bytes is better than a UUID

-- -- 1. Drop the existing CHECK constraint if it exists
-- ALTER TABLE con4_schema.game_info
-- DROP CONSTRAINT IF EXISTS gameinfo_gamemode_check;

-- -- 2. Add the updated CHECK constraint with allowed gamemode values
-- ALTER TABLE con4_schema.game_info
-- ADD CONSTRAINT gameinfo_gamemode_check
-- CHECK (
--  gamemode IN ('ranked-standard-bullet', 
--               'ranked-standard-blitz',
--               'ranked-standard-rapid',
--               'casual-standard')
-- );

---------- Game Players AND Elo ----------

-- CREATE TABLE IF NOT EXISTS con4_schema.player_elo (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   player UUID NOT NULL REFERENCES con4_schema.users(id) ON DELETE CASCADE, -- if user is deleted, their elo is gone
--   mode UUID NOT NULL REFERENCES con4_schema.game_info(id) ON DELETE CASCADE, -- if mode is deleted, elo is gone
--   elo FLOAT NOT NULL CHECK (elo > 0), -- no default as it varies
--   UNIQUE (player, mode)
-- );

---------- Events ----------

CREATE TABLE IF NOT EXISTS con4_schema.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_id INT UNIQUE NOT NULL, -- this is the new 4 Byte ID
  title VARCHAR(128) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_participants INT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES con4_schema.users(id), -- the admin who is hosting the event
  CHECK (mode_id > 65535) -- Ensure mode_id is greater than 65535
);

CREATE TABLE IF NOT EXISTS con4_schema.event_participants (
  event_id UUID NOT NULL REFERENCES con4_schema.events(id) ON DELETE CASCADE, -- if event is deleted, participants are gone
  user_id UUID NOT NULL REFERENCES con4_schema.users(id) ON DELETE CASCADE, -- if user is deleted, their participation is gone
  signed_up_at TIMESTAMP DEFAULT now(), -- use for the time they signed up
  PRIMARY KEY (event_id, user_id) -- A user can only sign up for an event once
);

---------- INDEXES ----------

CREATE INDEX IF NOT EXISTS idx_usertags_userid ON con4_schema.user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_elo_playerid ON con4_schema.player_elo(player);
CREATE INDEX IF NOT EXISTS idx_gameplayers_game_id ON con4_schema.game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_gameplayers_player_identity ON con4_schema.game_players(player_identity);
-- CREATE INDEX IF NOT EXISTS idx_usertags_tag_name ON con4_schema.UserTags(tag_name); -- not needed yet
