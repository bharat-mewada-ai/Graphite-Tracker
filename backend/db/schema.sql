-- Pehle is file ko Supabase ya psql mein run karo
-- Sirf ek baar run karna hai

CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role         VARCHAR(20) DEFAULT 'teacher',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entries (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id),
  logged_by   VARCHAR(100),
  class       VARCHAR(50) NOT NULL,
  category    VARCHAR(30) NOT NULL,
  kg          NUMERIC(6,2) NOT NULL CHECK (kg > 0 AND kg < 500),
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goals (
  id           SERIAL PRIMARY KEY,
  category     VARCHAR(30) UNIQUE NOT NULL,
  target_kg    NUMERIC(8,2) NOT NULL,
  academic_year VARCHAR(10) NOT NULL DEFAULT '2025-26'
);

-- Default goals daal do
INSERT INTO goals (category, target_kg) VALUES
  ('paper', 300), ('plastic', 200), ('metal', 100),
  ('glass', 80),  ('ewaste', 40),   ('organic', 280);

-- Speed ke liye indexes
CREATE INDEX idx_entries_date     ON entries(entry_date);
CREATE INDEX idx_entries_class    ON entries(class);
CREATE INDEX idx_entries_category ON entries(category);