import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnacnomzyxnxkwhzekfl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYWNub216eXhueGt3aHpla2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3OTE5MjIsImV4cCI6MjA5OTM2NzkyMn0.j1wEZG9Dq54ztXDXjgiH7AOT22gsQR8a66jhvny-rSM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
    const email = `testuser_${Date.now()}@example.com`
    console.log('Testing sign up with email', email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
        options: {
            data: {
                role: 'Farmer',
                full_name: 'Test User',
                username: `testuser_${Date.now()}`
            }
        }
    })

    if (authError) {
        console.error('Auth Error during signup:', authError)
        return
    }

    console.log('Sign up successful! User ID:', authData.user?.id)

    // Check if the user exists in public.users
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user?.id)
        .single()

    if (userError) {
        console.error('Error fetching from public.users (Is the trigger broken?):', userError.message)
    } else {
        console.log('Successfully found user in public.users:', userData)
    }

    console.log('Attempting login immediately...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: 'Password123!'
    })

    if (loginError) {
        console.error('Login error:', loginError.message)
    } else {
        console.log('Login successful! Session established.')
    }
}

testAuth()
