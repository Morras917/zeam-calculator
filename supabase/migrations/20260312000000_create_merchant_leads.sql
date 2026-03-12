CREATE TABLE IF NOT EXISTS merchant_leads (
  id bigint generated always as identity primary key,
  shop_name text,
  currency text not null default 'ZAR',
  customers_per_day integer not null,
  avg_transaction integer not null,
  monthly_airtime integer not null,
  monthly_electricity integer not null,
  referrals integer not null,
  monthly_earnings integer not null,
  annual_earnings integer not null,
  created_at timestamptz default now()
);

-- Allow inserts via service role key
ALTER TABLE merchant_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role inserts" ON merchant_leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role select" ON merchant_leads
  FOR SELECT
  TO service_role
  USING (true);
