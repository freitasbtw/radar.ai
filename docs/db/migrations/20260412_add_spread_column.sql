-- Add a computed column to auction_lots to allow sorting by spread percentage
BEGIN;

ALTER TABLE public.auction_lots
ADD COLUMN IF NOT EXISTS spread_percent numeric GENERATED ALWAYS AS (
  CASE 
    WHEN min_bid IS NOT NULL AND min_bid > 0 AND appraisal_value IS NOT NULL AND appraisal_value > min_bid
    THEN ((appraisal_value - min_bid) / min_bid) * 100
    ELSE 0 
  END
) STORED;

CREATE INDEX IF NOT EXISTS idx_auction_lots_spread_percent
  ON public.auction_lots(spread_percent DESC NULLS LAST);

COMMIT;