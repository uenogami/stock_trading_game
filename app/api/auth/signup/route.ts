import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // ユーザーテーブルにレコードを作成
    if (data.user) {
      const { gameRules } = await import('@/config')
      await supabase.from('users').insert({
        id: data.user.id,
        name: name || email.split('@')[0],
        email: email,
        cash: gameRules.initialCash,
        holdings: gameRules.initialHoldings,
      })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

