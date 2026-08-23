-- =============================================================
-- Mahee Nexus — Database Schema
-- Run this entire file in Supabase SQL Editor
-- =============================================================

CREATE TABLE roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    is_job_seeker  BOOLEAN      DEFAULT false,
    is_employer    BOOLEAN      DEFAULT false,
    is_super_admin BOOLEAN      DEFAULT false,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_seeker_profiles (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER      NOT NULL,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    phone               VARCHAR(20),
    resume_path         VARCHAR(255),
    verification_status VARCHAR(50)  DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE companies (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    logo_path   VARCHAR(255),
    description TEXT,
    industry    VARCHAR(100),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employer_profiles (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER     NOT NULL,
    company_id          INTEGER,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    phone               VARCHAR(20),
    verification_status VARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE jobs (
    id               SERIAL PRIMARY KEY,
    company_id       INTEGER      NOT NULL,
    employer_id      INTEGER      NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT         NOT NULL,
    location         VARCHAR(255),
    salary_min       INTEGER,
    salary_max       INTEGER,
    experience_level VARCHAR(50),
    employment_type  VARCHAR(50),
    status           VARCHAR(50)  DEFAULT 'open',
    approval_status  VARCHAR(50)  DEFAULT 'pending_approval',
    deadline         DATE,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id)  REFERENCES companies(id)         ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id                  SERIAL PRIMARY KEY,
    job_id              INTEGER     NOT NULL,
    user_id             INTEGER     NOT NULL,
    status              VARCHAR(50) DEFAULT 'pending',
    admin_review_status VARCHAR(50) DEFAULT 'pending',
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    -- Prevents duplicate applications at the DB level
    CONSTRAINT uq_application UNIQUE (user_id, job_id),
    FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE saved_jobs (
    id       SERIAL PRIMARY KEY,
    user_id  INTEGER   NOT NULL,
    job_id   INTEGER   NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (job_id)  REFERENCES jobs(id)   ON DELETE CASCADE,
    UNIQUE (user_id, job_id)
);

CREATE TABLE skills (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE education (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER      NOT NULL,
    institution    VARCHAR(255) NOT NULL,
    degree         VARCHAR(255),
    field_of_study VARCHAR(255),
    start_date     DATE,
    end_date       DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE experience (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER      NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title    VARCHAR(255) NOT NULL,
    description  TEXT,
    start_date   DATE,
    end_date     DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER   NOT NULL,
    message    TEXT      NOT NULL,
    is_read    BOOLEAN   DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE assignments (
    id                   SERIAL PRIMARY KEY,
    job_id               INTEGER   NOT NULL,
    employer_id          INTEGER   NOT NULL,
    employee_id          INTEGER   NOT NULL,
    assigned_by_admin_id INTEGER,
    start_date           DATE,
    end_date             DATE,
    status               VARCHAR(50) DEFAULT 'active',
    monthly_salary       INTEGER     DEFAULT 0,
    created_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id)      REFERENCES jobs(id)              ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES users(id)             ON DELETE CASCADE
);

CREATE TABLE attendance (
    id            SERIAL PRIMARY KEY,
    assignment_id INTEGER        NOT NULL,
    employee_id   INTEGER        NOT NULL,
    date          DATE           NOT NULL,
    status        VARCHAR(50)    DEFAULT 'present',
    hours_worked  DECIMAL(5, 2)  DEFAULT 8.0,
    notes         TEXT,
    created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    -- Prevents duplicate attendance entries at the DB level
    CONSTRAINT uq_attendance UNIQUE (assignment_id, employee_id, date),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id)   REFERENCES users(id)       ON DELETE CASCADE
);

CREATE TABLE invoices (
    id             SERIAL PRIMARY KEY,
    employer_id    INTEGER        NOT NULL,
    assignment_id  INTEGER,
    invoice_number VARCHAR(100)   NOT NULL UNIQUE,
    amount         DECIMAL(10, 2) NOT NULL,
    status         VARCHAR(50)    DEFAULT 'unpaid',
    issue_date     DATE           NOT NULL,
    due_date       DATE           NOT NULL,
    created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE
);

CREATE TABLE payroll (
    id               SERIAL PRIMARY KEY,
    employee_id      INTEGER        NOT NULL,
    assignment_id    INTEGER,
    amount           DECIMAL(10, 2) NOT NULL,
    pay_period_start DATE,
    pay_period_end   DATE,
    status           VARCHAR(50)    DEFAULT 'pending',
    payment_date     DATE,
    created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id          SERIAL PRIMARY KEY,
    sender_id   INTEGER   NOT NULL,
    receiver_id INTEGER,
    message     TEXT      NOT NULL,
    is_read     BOOLEAN   DEFAULT false,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id          SERIAL PRIMARY KEY,
    admin_id    INTEGER      NOT NULL,
    action      VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id   INTEGER,
    details     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX idx_users_email              ON users(email);
CREATE INDEX idx_jobs_title               ON jobs(title);
CREATE INDEX idx_jobs_location            ON jobs(location);
CREATE INDEX idx_jobs_status              ON jobs(status);
CREATE INDEX idx_jobs_approval_status     ON jobs(approval_status);
CREATE INDEX idx_jobs_company_id          ON jobs(company_id);
CREATE INDEX idx_jobs_deadline            ON jobs(deadline);
CREATE INDEX idx_applications_job_id      ON applications(job_id);
CREATE INDEX idx_applications_user_id     ON applications(user_id);
CREATE INDEX idx_applications_status      ON applications(status);
CREATE INDEX idx_assignments_job_id       ON assignments(job_id);
CREATE INDEX idx_assignments_employer_id  ON assignments(employer_id);
CREATE INDEX idx_assignments_employee_id  ON assignments(employee_id);
CREATE INDEX idx_attendance_assignment_id ON attendance(assignment_id);
CREATE INDEX idx_invoices_employer_id     ON invoices(employer_id);
CREATE INDEX idx_payroll_employee_id      ON payroll(employee_id);
CREATE INDEX idx_messages_sender_id       ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id     ON messages(receiver_id);
