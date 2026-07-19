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
