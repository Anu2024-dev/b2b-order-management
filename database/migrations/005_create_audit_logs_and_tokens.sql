-- Migration 005: Create Audit Logs and Token Revocations
-- Up Migration

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB,
    ip_address VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS token_revocations (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_revocations_jti ON token_revocations(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_revocations_expires_at ON token_revocations(expires_at);
