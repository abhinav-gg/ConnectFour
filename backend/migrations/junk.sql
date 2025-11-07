
-- CREATE TABLE IF NOT EXISTS con4_schema.puzzles ( -- These are going on NoSQL
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   full_solution VARCHAR(64) NOT NULL,
--   predicted_rating INT,
--   created_at TIMESTAMP DEFAULT now()
-- );

-- Hide the shitshow
-- CREATE TABLE IF NOT EXISTS events_schema.ICHack25 (
--   id VARCHAR(64) PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES con4_schema.Users(id),
--   discord_id VARCHAR(50) NOT NULL,
--   full_name VARCHAR(100) NOT NULL,
--   hackspace events_schema.hackspace NOT NULL
-- );
