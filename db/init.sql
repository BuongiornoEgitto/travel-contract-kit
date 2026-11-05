CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(trim(full_name)) > 0),
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  operator_name text NOT NULL CHECK (length(trim(operator_name)) > 0),
  operator_reference text NOT NULL DEFAULT '',
  agency_name text NOT NULL CHECK (length(trim(agency_name)) > 0),
  contract_template_text text NOT NULL CHECK (length(trim(contract_template_text)) > 0),
  trip_description text NOT NULL CHECK (length(trim(trip_description)) > 0),
  departure_date date NOT NULL,
  return_date date NOT NULL CHECK (return_date >= departure_date),
  travellers jsonb NOT NULL CHECK (jsonb_typeof(travellers) = 'array' AND jsonb_array_length(travellers) > 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  received_cents integer NOT NULL DEFAULT 0 CHECK (received_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contract_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
  payload jsonb NOT NULL,
  fingerprint char(64) NOT NULL,
  pdf bytea NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE confirmation_requests (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES contract_snapshots(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_ip text,
  accepted_user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX confirmation_requests_pending_idx ON confirmation_requests(snapshot_id) WHERE accepted_at IS NULL AND revoked_at IS NULL;
