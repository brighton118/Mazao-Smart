import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://rnacnomzyxnxkwhzekfl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYWNub216eXhueGt3aHpla2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3OTE5MjIsImV4cCI6MjA5OTM2NzkyMn0.j1wEZG9Dq54ztXDXjgiH7AOT22gsQR8a66jhvny-rSM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function log(msg) {
    fs.appendFileSync('test_log.txt', msg + '\n')
}

async function testFullFlow() {
    try {
        if (fs.existsSync('test_log.txt')) fs.unlinkSync('test_log.txt');

        const ts = Date.now();
        const email = `edwin_${ts}@example.com`;
        const username = `Edwin_${ts}`;

        log(`[1] Signing up with email: ${email} and username: ${username}`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: 'Password123!',
            options: {
                data: {
                    role: 'Farmer',
                    full_name: 'Edwin Test',
                    username: username
                }
            }
        })

        if (authError) {
            log('Auth Error during signup: ' + authError.message)
            return
        }

        log(`[2] Sign up successful! User ID: ${authData.user?.id}`)

        // Wait a brief moment for PostgreSQL trigger to complete insertion
        await new Promise(r => setTimeout(r, 1000));

        log(`[3] Testing RPC get_email_by_username with "${username}"...`);
        const { data, error } = await supabase.rpc('get_email_by_username', { p_username: username })

        if (error) {
            log('RPC Error: ' + error.message)
        } else {
            log(`RPC Data returned for ${username}: ` + JSON.stringify(data))
        }

        // Test with original "Edwin" as entered by user
        log(`\n[4] Testing RPC get_email_by_username with "Edwin"...`);
        const { data: d2, error: e2 } = await supabase.rpc('get_email_by_username', { p_username: 'Edwin' })

        if (e2) {
            log('RPC Error 2: ' + e2.message)
        } else {
            log(`RPC Data returned for "Edwin": ` + JSON.stringify(d2))
        }
    } catch (e) {
        log('Exception: ' + e.message)
    }
}

testFullFlow()
