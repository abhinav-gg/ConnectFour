CREATE SCHEMA IF NOT EXISTS con4_schema;

---------- Users ----------

CREATE TABLE IF NOT EXISTS con4_schema.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE,
  email VARCHAR(128) UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  profile_pic VARCHAR(512),
  password_hash VARCHAR(128),
  mail_provider CHAR(1) NOT NULL DEFAULT 'L',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL, -- used for soft deletes
  last_login TIMESTAMP 
);

-- 1. Drop the existing CHECK constraint
ALTER TABLE con4_schema.users 
DROP CONSTRAINT IF EXISTS users_mail_provider_check;

-- 2. Add the updated CHECK constraint with new options
ALTER TABLE con4_schema.users ADD CONSTRAINT users_mail_provider_check 
  CHECK (mail_provider IN ('L', 'G', 'H', 'D', 'A'));

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


---------- USER ELOS ----------

CREATE TABLE IF NOT EXISTS con4_schema.player_elo (
  player UUID NOT NULL REFERENCES con4_schema.users(id) ON DELETE CASCADE,
  mode INT NOT NULL CHECK (mode >= 0),
  elo NUMERIC(6,2) NOT NULL CHECK (elo > 0),
  PRIMARY KEY (player, mode)
);

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
