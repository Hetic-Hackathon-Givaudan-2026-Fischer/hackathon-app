-- Liens showroom temporaires, voir docs/adr/0010. Seul le hash du jeton est stocké
CREATE TABLE showroom_links (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  client_label TEXT NOT NULL CHECK (char_length(client_label) BETWEEN 1 AND 200),
  -- Périmètre : familles d'arômes visibles ; tableau vide = toutes
  families TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
