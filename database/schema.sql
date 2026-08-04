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

CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    hidden BOOLEAN NOT NULL DEFAULT TRUE,
    weight SMALLINT NOT NULL DEFAULT 1 CHECK (weight > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE TABLE submission_results (
    id BIGSERIAL PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
    passed BOOLEAN NOT NULL,
    actual_output TEXT,
    runtime_ms INTEGER,
    memory_kb INTEGER,
    error_message TEXT
);

CREATE TABLE ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    correctness_summary TEXT NOT NULL,
    time_complexity VARCHAR(100),
    space_complexity VARCHAR(100),
    edge_cases JSONB NOT NULL DEFAULT '[]'::JSONB,
    quality_feedback JSONB NOT NULL DEFAULT '[]'::JSONB,
    optimized_approach TEXT,
    model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookmarks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

CREATE TABLE mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(120) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    preferred_language VARCHAR(40),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'ABANDONED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_problems (
    interview_id UUID NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL,
    PRIMARY KEY (interview_id, problem_id),
    UNIQUE (interview_id, position)
);

CREATE TABLE interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('AI', 'USER', 'SYSTEM')),
    content TEXT NOT NULL,
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_reports (
    interview_id UUID PRIMARY KEY REFERENCES mock_interviews(id) ON DELETE CASCADE,
    overall_score NUMERIC(4,2) CHECK (overall_score BETWEEN 0 AND 10),
    problem_understanding NUMERIC(4,2),
    algorithm_selection NUMERIC(4,2),
    correctness NUMERIC(4,2),
    complexity_analysis NUMERIC(4,2),
    code_quality NUMERIC(4,2),
    communication NUMERIC(4,2),
    strengths JSONB NOT NULL DEFAULT '[]'::JSONB,
    improvements JSONB NOT NULL DEFAULT '[]'::JSONB,
    study_plan JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resume_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    target_company VARCHAR(160),
    target_role VARCHAR(160),
    job_description TEXT NOT NULL,
    match_score NUMERIC(5,2) CHECK (match_score BETWEEN 0 AND 100),
    matched_skills JSONB NOT NULL DEFAULT '[]'::JSONB,
    missing_skills JSONB NOT NULL DEFAULT '[]'::JSONB,
    bullet_suggestions JSONB NOT NULL DEFAULT '[]'::JSONB,
    recommended_topics JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_activity (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    interviews_completed INTEGER NOT NULL DEFAULT 0 CHECK (interviews_completed >= 0),
    practice_minutes INTEGER NOT NULL DEFAULT 0 CHECK (practice_minutes >= 0),
    points INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, activity_date)
);

CREATE TABLE user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_active_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_topic_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    attempts INTEGER NOT NULL DEFAULT 0,
    accepted INTEGER NOT NULL DEFAULT 0,
    mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
    last_practiced_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE ai_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feature VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_problems_difficulty_published ON problems(difficulty, published);
CREATE INDEX idx_submissions_user_date ON submissions(user_id, submitted_at DESC);
CREATE INDEX idx_submissions_problem_status ON submissions(problem_id, status);
CREATE INDEX idx_interview_messages_interview_date ON interview_messages(interview_id, created_at);
CREATE INDEX idx_resumes_user_date ON resumes(user_id, created_at DESC);
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date DESC);
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at DESC);

INSERT INTO topics (slug, name, description) VALUES
    ('arrays-strings', 'Arrays & Strings', 'Array, string, and two-pointer techniques'),
    ('sliding-window', 'Sliding Window', 'Fixed and variable-size window techniques'),
    ('hashing', 'Hashing', 'Hash maps, sets, and frequency counting'),
    ('trees', 'Trees', 'Binary trees, BSTs, and traversal'),
    ('graphs', 'Graphs', 'DFS, BFS, shortest paths, and graph modeling'),
    ('dynamic-programming', 'Dynamic Programming', 'Memoization and tabulation'),
    ('system-design', 'System Design', 'Scalable service and data-system design')
ON CONFLICT (slug) DO NOTHING;
