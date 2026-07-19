
-- ============================================================
-- AGRISENSE SMART SOIL MOISTURE MONITORING SYSTEM
-- MASTER DATABASE SETUP SCRIPT (V2 - CLEAN DATABASE INSTALL)
-- ============================================================
-- 
-- Run this entire script in your Supabase SQL Editor for the new project!
-- It handles everything: tables, triggers, RLS, and the login auth fixes.

-- ============================================================
-- AgriSense Smart Soil Moisture Monitoring System
-- Complete Supabase Database Schema
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PART 1: TABLE DEFINITIONS (20 tables)
-- ============================================================

-- 1. USERS (linked to Supabase auth.users via UUID)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Farmer', 'Agronomist', 'Technician')),
    profile_image TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. FARMS
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    farm_name TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. GREENHOUSES
CREATE TABLE IF NOT EXISTS public.greenhouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. OUTDOOR GARDENS
CREATE TABLE IF NOT EXISTS public.outdoor_gardens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    crop_type TEXT,
    area_sq_meters NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ESP32 DEVICES (IoT hardware nodes)
CREATE TABLE IF NOT EXISTS public.esp32_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    device_name TEXT NOT NULL,
    mac_address TEXT UNIQUE NOT NULL,
    firmware_version TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SOIL MOISTURE SENSORS
CREATE TABLE IF NOT EXISTS public.soil_moisture_sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    greenhouse_id UUID REFERENCES public.greenhouses(id) ON DELETE SET NULL,
    garden_id UUID REFERENCES public.outdoor_gardens(id) ON DELETE SET NULL,
    device_id UUID REFERENCES public.esp32_devices(id) ON DELETE SET NULL,
    sensor_code TEXT UNIQUE NOT NULL,
    crop TEXT,
    depth_cm INTEGER DEFAULT 20,
    min_moisture NUMERIC DEFAULT 30,
    max_moisture NUMERIC DEFAULT 70,
    current_moisture NUMERIC DEFAULT 45,
    current_temp NUMERIC DEFAULT 24.5,
    online BOOLEAN DEFAULT true,
    irrigating BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_sensor_location CHECK (
        (greenhouse_id IS NOT NULL AND garden_id IS NULL) OR
        (greenhouse_id IS NULL AND garden_id IS NOT NULL) OR
        (greenhouse_id IS NULL AND garden_id IS NULL)
    )
);

-- 7. WEATHER STATIONS
CREATE TABLE IF NOT EXISTS public.weather_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    model_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PUMPS
CREATE TABLE IF NOT EXISTS public.pumps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status BOOLEAN DEFAULT false,
    flow_rate_lpm NUMERIC DEFAULT 60.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. VALVES
CREATE TABLE IF NOT EXISTS public.valves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status BOOLEAN DEFAULT false,
    target_moisture_sensor_id UUID REFERENCES public.soil_moisture_sensors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. WATER TANKS
CREATE TABLE IF NOT EXISTS public.water_tanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    capacity_liters NUMERIC DEFAULT 5000.0,
    current_level_liters NUMERIC DEFAULT 3500.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. IRRIGATION LOGS
CREATE TABLE IF NOT EXISTS public.irrigation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valve_id UUID REFERENCES public.valves(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    water_used_liters NUMERIC DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. MOISTURE READINGS (high-frequency telemetry)
CREATE TABLE IF NOT EXISTS public.moisture_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID REFERENCES public.soil_moisture_sensors(id) ON DELETE CASCADE NOT NULL,
    value NUMERIC NOT NULL,
    temp_value NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. WEATHER READINGS
CREATE TABLE IF NOT EXISTS public.weather_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES public.weather_stations(id) ON DELETE CASCADE NOT NULL,
    condition TEXT NOT NULL,
    temp_value NUMERIC NOT NULL,
    humidity NUMERIC NOT NULL,
    wind_speed NUMERIC NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('alert', 'info', 'warning')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. AI RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. HARDWARE STATUS
CREATE TABLE IF NOT EXISTS public.hardware_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.esp32_devices(id) ON DELETE CASCADE NOT NULL,
    battery_level INTEGER NOT NULL CHECK (battery_level BETWEEN 0 AND 100),
    wifi_signal INTEGER NOT NULL,
    uptime_seconds BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. SOLAR SYSTEM
CREATE TABLE IF NOT EXISTS public.solar_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    current_output_watts NUMERIC DEFAULT 0.0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. BATTERIES
CREATE TABLE IF NOT EXISTS public.batteries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solar_id UUID REFERENCES public.solar_system(id) ON DELETE CASCADE NOT NULL,
    charge_percent NUMERIC DEFAULT 100.0 CHECK (charge_percent BETWEEN 0 AND 100),
    voltage NUMERIC DEFAULT 12.6,
    status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'unhealthy', 'undercharged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. DASHBOARD SETTINGS
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    theme TEXT DEFAULT 'dark',
    layout_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error')),
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================
-- PART 2: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_farms_owner ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_greenhouses_farm ON public.greenhouses(farm_id);
CREATE INDEX IF NOT EXISTS idx_gardens_farm ON public.outdoor_gardens(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensors_device ON public.soil_moisture_sensors(device_id);
CREATE INDEX IF NOT EXISTS idx_sensors_code ON public.soil_moisture_sensors(sensor_code);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_time ON public.moisture_readings(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_valve_time ON public.irrigation_logs(valve_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON public.notifications(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level_time ON public.system_logs(log_level, created_at DESC);


-- ============================================================
-- PART 3: TRIGGER FUNCTIONS
-- ============================================================

-- Auto-update updated_at column on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (DROP first for idempotency)
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.farms;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.greenhouses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.greenhouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.outdoor_gardens;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.outdoor_gardens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.esp32_devices;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.esp32_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.soil_moisture_sensors;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.soil_moisture_sensors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.weather_stations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.weather_stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.pumps;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pumps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.valves;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.valves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.water_tanks;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.water_tanks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.irrigation_logs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.irrigation_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.solar_system;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.solar_system FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.batteries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.batteries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.dashboard_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.dashboard_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- PART 4: AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

-- When a new user signs up via Supabase Auth, this trigger automatically
-- creates their profile in public.users and a default farm in public.farms.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_username TEXT;
    v_phone TEXT;
    v_farm_name TEXT;
    v_farm_location TEXT;
    v_district TEXT;
    v_village TEXT;
    v_gps TEXT;
    v_lat DOUBLE PRECISION;
    v_lng DOUBLE PRECISION;
    v_farm_id UUID;
BEGIN
    -- Extract values from auth metadata with fallbacks
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'Farmer');
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'AgriSense User');
    v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
    v_phone := COALESCE(new.raw_user_meta_data->>'phone', '');
    v_farm_name := COALESCE(new.raw_user_meta_data->>'farm_name', 'Mbarara Pilot Farm');
    v_farm_location := new.raw_user_meta_data->>'farm_location';

    -- Insert user profile
    INSERT INTO public.users (id, full_name, username, email, phone, role, preferred_language, created_at, updated_at)
    VALUES (
        new.id,
        v_full_name,
        v_username,
        new.email,
        v_phone,
        v_role,
        COALESCE(new.raw_user_meta_data->>'preferred_language', 'en'),
        now(),
        now()
    );

    -- Parse farm location (expects JSON format from frontend)
    IF v_farm_location IS NOT NULL THEN
        BEGIN
            v_district := (v_farm_location::json)->>'district';
            v_village := (v_farm_location::json)->>'village';
            v_gps := (v_farm_location::json)->>'gps';
        EXCEPTION WHEN OTHERS THEN
            v_district := 'Mbarara';
            v_village := 'Ruti';
            v_gps := '-0.6074, 30.6548';
        END;
    ELSE
        v_district := COALESCE(new.raw_user_meta_data->>'district', 'Mbarara');
        v_village := COALESCE(new.raw_user_meta_data->>'village', 'Ruti');
        v_gps := COALESCE(new.raw_user_meta_data->>'gps', '-0.6074, 30.6548');
    END IF;

    -- Parse GPS coordinates
    v_lat := -0.6074;
    v_lng := 30.6548;
    IF v_gps IS NOT NULL AND position(',' in v_gps) > 0 THEN
        BEGIN
            v_lat := split_part(v_gps, ',', 1)::DOUBLE PRECISION;
            v_lng := split_part(v_gps, ',', 2)::DOUBLE PRECISION;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- keep fallback Mbarara coordinates
        END;
    END IF;

    -- Create default farm for the user
    INSERT INTO public.farms (owner_id, farm_name, district, village, latitude, longitude, description, created_at, updated_at)
    VALUES (
        new.id,
        v_farm_name,
        v_district,
        v_village,
        v_lat,
        v_lng,
        'Main cultivation site',
        now(),
        now()
    ) RETURNING id INTO v_farm_id;

    -- Bootstrap default infrastructure for the farm
    INSERT INTO public.solar_system (farm_id, current_output_watts, status) VALUES (v_farm_id, 320.0, 'active');
    INSERT INTO public.water_tanks (farm_id, name, capacity_liters, current_level_liters) VALUES (v_farm_id, 'Primary Reservoir', 5000.0, 3200.0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.greenhouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outdoor_gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esp32_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_moisture_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moisture_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent cleanup)
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND policyname LIKE 'agrisense_%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Users: all authenticated can read; only own record can be updated
CREATE POLICY "agrisense_users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "agrisense_users_update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "agrisense_users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Farms: all authenticated can read; owners can modify
CREATE POLICY "agrisense_farms_select" ON public.farms FOR SELECT TO authenticated USING (true);
CREATE POLICY "agrisense_farms_insert" ON public.farms FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "agrisense_farms_update" ON public.farms FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "agrisense_farms_delete" ON public.farms FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Shared farm infrastructure: all authenticated users can read and write
-- (cooperative pilot model — all team members share access)
CREATE POLICY "agrisense_greenhouses_all" ON public.greenhouses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_outdoor_gardens_all" ON public.outdoor_gardens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_esp32_devices_all" ON public.esp32_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_sensors_all" ON public.soil_moisture_sensors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_weather_stations_all" ON public.weather_stations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_pumps_all" ON public.pumps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_valves_all" ON public.valves FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_water_tanks_all" ON public.water_tanks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_irrigation_logs_all" ON public.irrigation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_moisture_readings_all" ON public.moisture_readings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_weather_readings_all" ON public.weather_readings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_notifications_all" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_ai_recommendations_all" ON public.ai_recommendations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_hardware_status_all" ON public.hardware_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_solar_system_all" ON public.solar_system FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_batteries_all" ON public.batteries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_dashboard_settings_all" ON public.dashboard_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agrisense_system_logs_all" ON public.system_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- PART 6: SEED DATA (Demo accounts and farm infrastructure)
-- ============================================================
-- NOTE: These inserts use Supabase Auth admin functions.
-- If you prefer manual user creation, skip this section and
-- register users through the application's sign-up form.

-- The handle_new_user() trigger will automatically create
-- entries in public.users and public.farms when users sign up.

-- To create demo users manually, go to Supabase Dashboard >
-- Authentication > Users > Add User, and use these credentials:
--
--   Admin:      admin@agrisense.io       / admin123
--   Farmer:     farmer@agrisense.io      / farmer123
--   Agronomist: agronomist@agrisense.io  / agro123
--   Technician: technician@agrisense.io  / tech123
--
-- Set the following User Metadata (JSON) for each user:
--
--   {
--     "role": "Administrator",
--     "full_name": "Admin Name",
--     "username": "admin",
--     "phone": "+256700000001",
--     "farm_name": "Mbarara Main Hub",
--     "farm_location": "{\"district\":\"Mbarara\",\"village\":\"Kakoba\",\"gps\":\"-0.6074, 30.6548\"}"
--   }

-- ============================================================
-- DONE! All 20 tables, indexes, triggers, and RLS policies
-- have been created. You can now:
--
-- 1. Create users in Supabase Auth Dashboard
-- 2. Copy the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
--    from Settings > API into your .env file
-- 3. Start the application with: npm run dev
-- ============================================================


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


-- ============================================================
-- AgriSense Username Login Hotfix V2 (CASE INSENSITIVE)
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- This function bypasses Row Level Security (RLS) safely because of SECURITY DEFINER
-- This enables users who aren't logged in (anon) to lookup their email via their username
-- securely without exposing the entire `public.users` table to the internet.

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    -- Using ILIKE ensures that "edwin" and "Edwin" match safely.
    SELECT email INTO v_email 
    FROM public.users 
    WHERE username ILIKE p_username 
    LIMIT 1;
    
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicitly allow both logged out (anon) and logged in (authenticated) users to execute this
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated;
