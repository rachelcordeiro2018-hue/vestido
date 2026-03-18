import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'email@example.com',
    password: 'PASSWORD_HERE',
  })

  if (error) {
    console.error('Error creating user:', error.message)
  } else {
    console.log('User created successfully:', data.user?.email || 'Email missing in response')
    console.log('Result data:', JSON.stringify(data, null, 2))
  }
}

createUser()
