import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const clean = username.trim().toLowerCase()

  if (clean.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
  }

  // Use admin client — bypasses email domain validation and auto-confirms the account
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminClient.auth.admin.createUser({
    email: `${clean}@musicranker.internal`,
    password,
    user_metadata: { username: clean },
    email_confirm: true,
  })

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      return NextResponse.json({ error: 'That username is already taken' }, { status: 409 })
    }
    if (error.message.includes('password') || error.message.includes('Password')) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
