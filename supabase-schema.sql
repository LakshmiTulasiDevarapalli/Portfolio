-- ============================================================
-- PORTFOLIO APP - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'xlsx', 'pptx', 'link')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Access requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  download_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Storage bucket (run separately or via Supabase dashboard)
-- Create a bucket named "resources" with public: false

-- 4. Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Resources: anyone can read active ones
CREATE POLICY "Public can view active resources"
  ON resources FOR SELECT
  USING (is_active = true);

-- Resources: only service role can insert/update/delete
CREATE POLICY "Service role manages resources"
  ON resources FOR ALL
  USING (auth.role() = 'service_role');

-- Access requests: anyone can insert
CREATE POLICY "Anyone can create access request"
  ON access_requests FOR INSERT
  WITH CHECK (true);

-- Access requests: service role can do everything
CREATE POLICY "Service role manages requests"
  ON access_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Access requests: users can read their own by token
CREATE POLICY "Public can read approved requests by token"
  ON access_requests FOR SELECT
  USING (status = 'approved');

-- 5. Indexes
CREATE INDEX idx_resources_active ON resources(is_active);
CREATE INDEX idx_requests_status ON access_requests(status);
CREATE INDEX idx_requests_token ON access_requests(download_token);
CREATE INDEX idx_requests_resource ON access_requests(resource_id);

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE BUCKET POLICY (run after creating bucket "resources")
-- ============================================================
-- In Supabase Dashboard > Storage > resources bucket > Policies:
-- Add policy: Allow service role full access
-- INSERT: (auth.role() = 'service_role')
-- SELECT: (auth.role() = 'service_role')
-- DELETE: (auth.role() = 'service_role')
