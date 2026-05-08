import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lptwaxlygqjnrctrqhge.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdHdheGx5Z3FqbnJjdHJxaGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjIyMTUsImV4cCI6MjA5MTczODIxNX0.9aybRYDfbDM2TBfq3E4LE1X24vyOJHUNLo25S7shNFE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)