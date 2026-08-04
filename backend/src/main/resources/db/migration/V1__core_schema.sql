CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    preferred_language VARCHAR(40) NOT NULL DEFAULT 'JAVA',
    target_role VARCHAR(120),
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
    role VARCHAR(30) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE topics (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(240) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    constraints_text TEXT,
    estimated_minutes SMALLINT CHECK (estimated_minutes > 0),
    acceptance_rate NUMERIC(5,2) CHECK (acceptance_rate BETWEEN 0 AND 100),
    frequency VARCHAR(20) CHECK (frequency IN ('LOW', 'MEDIUM', 'HIGH')),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE problem_topics (
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, topic_id)
);

CREATE TABLE problem_examples (
    id BIGSERIAL PRIMARY KEY,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    explanation TEXT,
    UNIQUE (problem_id, position)
);

CREATE TABLE starter_code (
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(40) NOT NULL,
    source_code TEXT NOT NULL,
    PRIMARY KEY (problem_id, language)
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(40) NOT NULL,
    source_code TEXT NOT NULL,
    status VARCHAR(40) NOT NULL CHECK (status IN (
        'QUEUED', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER',
        'COMPILATION_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'FAILED'
    )),
    runtime_ms INTEGER CHECK (runtime_ms >= 0),
    memory_kb INTEGER CHECK (memory_kb >= 0),
    passed_tests INTEGER NOT NULL DEFAULT 0,
    total_tests INTEGER NOT NULL DEFAULT 0,
    judge_reference VARCHAR(255),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_problems_difficulty_published ON problems(difficulty, published);
CREATE INDEX idx_submissions_user_date ON submissions(user_id, submitted_at DESC);
CREATE INDEX idx_submissions_problem_status ON submissions(problem_id, status);

INSERT INTO topics (slug, name, description) VALUES
    ('arrays-strings', 'Arrays & Strings', 'Array, string, and two-pointer techniques'),
    ('sliding-window', 'Sliding Window', 'Fixed and variable-size window techniques'),
    ('hashing', 'Hashing', 'Hash maps, sets, and frequency counting'),
    ('trees', 'Trees', 'Binary trees, BSTs, and traversal'),
    ('graphs', 'Graphs', 'DFS, BFS, shortest paths, and graph modeling'),
    ('dynamic-programming', 'Dynamic Programming', 'Memoization and tabulation'),
    ('system-design', 'System Design', 'Scalable service and data-system design')
ON CONFLICT (slug) DO NOTHING;
