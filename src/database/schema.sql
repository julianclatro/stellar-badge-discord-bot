DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id text PRIMARY KEY,
  discord_user_id text,
  access_token text,
  refresh_token text,
  public_key text,
  expires_at text,
  deleted_at datetime,
  created_at datetime,
  updated_at datetime
);