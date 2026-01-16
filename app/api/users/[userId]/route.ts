import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { userId } = await context.params

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 最後の取引時刻を取得（クールダウン計算用）
    const { data: lastTrade } = await supabase
      .from('trades')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        cash: user.cash,
        holdings: user.holdings || {},
        totalAsset: user.cash,
        delta24h: 0,
        buyCount: 0,
        insuranceUsed: user.insurance_used || false,
      },
      lastTradeTime: lastTrade ? new Date(lastTrade.created_at).getTime() : null,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

