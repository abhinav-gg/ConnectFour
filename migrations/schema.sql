CREATE SCHEMA IF NOT EXISTS con4_schema;

---------- Users ----------

CREATE TABLE IF NOT EXISTS con4_schema.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL
    CHECK (char_length(username) >= 3),
  email VARCHAR(254) UNIQUE NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  profile_pic VARCHAR(512),
  password_hash VARCHAR(128),
  mail_provider CHAR(1) NOT NULL DEFAULT 'L',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP DEFAULT NULL, -- used for soft deletes
  last_login TIMESTAMP DEFAULT now()
);

-- 1. Drop the existing CHECK constraint
ALTER TABLE con4_schema.users 
DROP CONSTRAINT IF EXISTS users_mail_provider_check;

-- 2. Add the updated CHECK constraint with new options
ALTER TABLE con4_schema.users ADD CONSTRAINT users_mail_provider_check 
  CHECK (mail_provider IN ('L', 'G' ,'D'));

---------- User Tags ----------

CREATE TABLE IF NOT EXISTS con4_schema.tags (
  name VARCHAR(64) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS con4_schema.user_tags (
  user_id UUID NOT NULL REFERENCES con4_schema.users(id),
  tag_name VARCHAR(64) NOT NULL REFERENCES con4_schema.tags(name),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, tag_name)
);

INSERT INTO con4_schema.tags (name) VALUES
  ('IM'),       -- International Master
  ('GM'),       -- Grandmaster
  ('Admin'),    -- Administrator / staff
  ('Premium'),  -- Paid supporter or subscription
  ('Streamer'), -- Verified streamer or content creator
  ('Tester')    -- Internal or public beta tester
ON CONFLICT DO NOTHING;


---------- USER ELOS ----------

CREATE TABLE IF NOT EXISTS con4_schema.player_elo (
  player UUID NOT NULL REFERENCES con4_schema.users(id) ON DELETE CASCADE,
  mode INT NOT NULL CHECK (mode >= 0),
  elo NUMERIC(6,2) NOT NULL CHECK (elo > 0),
  updated_at TIMESTAMP DEFAULT now(),
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
  created_at TIMESTAMP DEFAULT now(), -- use for the time they signed up
  PRIMARY KEY (event_id, user_id) -- A user can only sign up for an event once
);

---------- INDEXES ----------

CREATE INDEX IF NOT EXISTS idx_usertags_tag_name ON con4_schema.user_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_player_elo_mode_id ON con4_schema.player_elo(mode); -- aka the leaderboard index
CREATE INDEX IF NOT EXISTS idx_eventparticipants_userid ON con4_schema.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_end ON con4_schema.events (start_time, end_time);

---------- TRIGGERS ----------

CREATE OR REPLACE FUNCTION con4_schema.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE OR REPLACE TRIGGER trg_set_updated_at_users
BEFORE UPDATE ON con4_schema.users
FOR EACH ROW
EXECUTE FUNCTION con4_schema.set_updated_at();

-- Player Elo table
CREATE OR REPLACE TRIGGER trg_set_updated_at_elo
BEFORE UPDATE ON con4_schema.player_elo
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION con4_schema.set_updated_at();

