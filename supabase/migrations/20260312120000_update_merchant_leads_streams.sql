-- Add new revenue stream columns
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS monthly_vouchers integer;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS monthly_remittance integer;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS monthly_qr_sales integer;

-- Drop old columns that no longer apply
ALTER TABLE merchant_leads DROP COLUMN IF EXISTS customers_per_day;
ALTER TABLE merchant_leads DROP COLUMN IF EXISTS avg_transaction;
ALTER TABLE merchant_leads DROP COLUMN IF EXISTS monthly_electricity;
