-- Signalements de problèmes de données (rapport d'analyse), voir docs/adr/0008
CREATE TABLE data_issues (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- NULL : le signalement porte sur le rapport global, pas sur un arôme
  trend_id TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  contact TEXT,
  request_id TEXT NOT NULL,
  data_origin TEXT NOT NULL CHECK (data_origin IN ('data_ai', 'csv_fallback')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
