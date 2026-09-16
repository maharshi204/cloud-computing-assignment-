CREATE TABLE IF NOT EXISTS books (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title            TEXT        NOT NULL,
  author           TEXT        NOT NULL,
  isbn             VARCHAR(13) NOT NULL UNIQUE,
  publication_year INTEGER     NOT NULL,
  quantity         INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_title  ON books (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_books_author ON books (LOWER(author));
