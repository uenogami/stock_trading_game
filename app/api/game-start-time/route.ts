import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: firstTrade, error } = await supabase
      .from('trades')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Get game start time error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const serverNow = new Date().toISOString();

    if (!firstTrade) {
      return NextResponse.json({ 
        gameStartTime: serverNow,
        hasTrades: false,
        serverNow: serverNow
      })
    }

    return NextResponse.json({ 
      gameStartTime: firstTrade.created_at,
      hasTrades: true,
      serverNow: serverNow
    })
  } catch (error) {
    console.error('Get game start time error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

