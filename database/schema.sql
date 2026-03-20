-- ============================================================
-- Legal Express — PostgreSQL Schema DDL
-- PostgreSQL 16+
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TYPES / ENUMS
-- ============================================================

CREATE TYPE matter_status   AS ENUM ('OPEN', 'CLOSED', 'PENDING');
CREATE TYPE document_type   AS ENUM ('CONTRACT', 'INVOICE', 'AGREEMENT', 'LETTER', 'NDA');
CREATE TYPE document_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE invoice_status  AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE job_status      AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE matters (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      matter_status NOT NULL DEFAULT 'OPEN',
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE jobs (
    id           UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    status       job_status NOT NULL DEFAULT 'QUEUED',
    payload      JSONB      NOT NULL DEFAULT '{}',
    result       JSONB,
    error        TEXT,
    attempts     INT        NOT NULL DEFAULT 0,
    max_attempts INT        NOT NULL DEFAULT 3,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
    id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title      VARCHAR(255)    NOT NULL,
    type       document_type   NOT NULL,
    content    TEXT,
    file_url   TEXT,
    status     document_status NOT NULL DEFAULT 'PENDING',
    form_data  JSONB           NOT NULL DEFAULT '{}',
    matter_id  UUID            REFERENCES matters(id) ON DELETE SET NULL,
    job_id     UUID            UNIQUE REFERENCES jobs(id),
    created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT           UNIQUE,
    amount         NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status         invoice_status NOT NULL DEFAULT 'PENDING',
    due_date       TIMESTAMPTZ    NOT NULL,
    user_id        UUID           NOT NULL REFERENCES users(id),
    matter_id      UUID           NOT NULL REFERENCES matters(id),
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Strategy
-- Rule: index columns used in WHERE, JOIN, and ORDER BY clauses
-- that return < 20% of rows. Avoid over-indexing write-heavy tables.
-- ============================================================

-- matters: common queries by user + status filter
CREATE INDEX idx_matters_user_id     ON matters(user_id);
CREATE INDEX idx_matters_status      ON matters(status);
CREATE INDEX idx_matters_user_status ON matters(user_id, status); -- Composite for "my open matters"

-- documents: most queries fetch by matter or poll by status
CREATE INDEX idx_documents_matter_id ON documents(matter_id);
CREATE INDEX idx_documents_status    ON documents(status);
CREATE INDEX idx_documents_job_id    ON documents(job_id); -- Already UNIQUE, but explicit

-- invoices: primary query pattern is "user's open invoices"
CREATE INDEX idx_invoices_user_status   ON invoices(user_id, status);
CREATE INDEX idx_invoices_matter_id     ON invoices(matter_id);
CREATE INDEX idx_invoices_due_date      ON invoices(due_date) WHERE status = 'PENDING'; -- Partial index
CREATE INDEX idx_invoices_transaction   ON invoices(transaction_id) WHERE transaction_id IS NOT NULL;

-- jobs: worker polls frequently by status
CREATE INDEX idx_jobs_status     ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC); -- For queue ordering

-- ============================================================
-- TRIGGERS — Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_matters_updated_at
    BEFORE UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();