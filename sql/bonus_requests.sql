-- Bonus requests table for managers to request and owners to approve
CREATE TABLE IF NOT EXISTS bonus_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  requested_by_wallet VARCHAR(255),
  amount NUMERIC NOT NULL DEFAULT 0,
  month VARCHAR(7) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for noww
ALTER TABLE bonus_requests DISABLE ROW LEVEL SECURITY;