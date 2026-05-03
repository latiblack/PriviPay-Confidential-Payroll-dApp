ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS contract_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS contract_deployed_at TIMESTAMP WITH TIME ZONE;