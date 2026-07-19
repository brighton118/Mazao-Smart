import fs from 'fs'

try {
    const baseSchema = fs.readFileSync('supabase_schema.sql', 'utf8')
    const newTables = fs.readFileSync('new_tables.sql', 'utf8')
    const loginPatch = fs.readFileSync('fix_username_login.sql', 'utf8')

    let masterSQL = `
-- ============================================================
-- AGRISENSE SMART SOIL MOISTURE MONITORING SYSTEM
-- MASTER DATABASE SETUP SCRIPT (V2 - CLEAN DATABASE INSTALL)
-- ============================================================
-- 
-- Run this entire script in your Supabase SQL Editor for the new project!
-- It handles everything: tables, triggers, RLS, and the login auth fixes.

` + baseSchema + `

` + newTables + `

` + loginPatch;

    fs.writeFileSync('database_setup_master.sql', masterSQL)
    console.log('Successfully generated database_setup_master.sql')
} catch (e) {
    console.error('Failed: ', e.message)
}
