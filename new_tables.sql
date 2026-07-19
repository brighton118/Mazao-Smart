-- ============================================================
-- AgriSense Smart Soil Moisture Monitoring System
-- NEW TABLES EXTENSION (Water Billing & Tariffs)
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- 1. WATER TARIFFS
-- Stores global or farm-specific tariff configurations for billing calculation.
CREATE TABLE IF NOT EXISTS public.water_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    rate_per_liter NUMERIC NOT NULL DEFAULT 15.0,
    currency TEXT NOT NULL DEFAULT 'UGX',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. INVOICES
-- Mirrors the Invoice interface inside WaterBilling.tsx
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_ref TEXT UNIQUE NOT NULL, -- e.g., 'INV-0705'
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_ugx NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'cancelled')),
    greenhouse_liters NUMERIC NOT NULL DEFAULT 0,
    outfield_liters NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add to auto-update timestamp triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.water_tariffs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.water_tariffs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.invoices;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.water_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies for Invoices & Tariffs
CREATE POLICY "agrisense_water_tariffs_select" ON public.water_tariffs 
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "agrisense_water_tariffs_admin" ON public.water_tariffs 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'Administrator'
        )
    );

CREATE POLICY "agrisense_invoices_select" ON public.invoices 
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = public.invoices.farm_id AND farms.owner_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'Administrator'
        )
    );

CREATE POLICY "agrisense_invoices_update" ON public.invoices 
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('Administrator', 'Technician')
        )
    );

CREATE POLICY "agrisense_invoices_insert" ON public.invoices 
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('Administrator', 'Technician')
        )
    );
