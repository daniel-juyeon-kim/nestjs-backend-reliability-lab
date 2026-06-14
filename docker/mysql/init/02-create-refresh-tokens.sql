CREATE TABLE IF NOT EXISTS refresh_tokens (
  id varchar(36) NOT NULL,
  userId varchar(36) NOT NULL,
  tokenHash varchar(255) NOT NULL,
  expiresAt datetime NOT NULL,
  revokedAt datetime NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_refresh_tokens_token_hash (tokenHash),
  KEY IDX_refresh_tokens_user_id (userId),
  CONSTRAINT FK_refresh_tokens_user_id FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);
