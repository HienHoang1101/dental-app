-- Add pricing support for medications and prescription item snapshots.
ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0;

ALTER TABLE public.prescription_items
ADD COLUMN IF NOT EXISTS unit_price integer NOT NULL DEFAULT 0;

-- Backfill existing prescription items from the current medication price.
UPDATE public.prescription_items pi
SET unit_price = COALESCE(NULLIF(pi.unit_price, 0), m.price, 0)
FROM public.medications m
WHERE pi.medication_id = m.id;
