import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 株価非表示カードがアクティブかチェック（他のプレーヤー用）
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 株価非表示カードがアクティブなユーザーを取得（全員、本人含む）
    const { data: activeCards } = await supabase
      .from('user_cards')
      .select('user_id, expires_at')
      .eq('card_id', 'hide-prices')
      .eq('active', true)

    if (!activeCards || activeCards.length === 0) {
      return NextResponse.json({ isHidden: false })
    }

    // 有効期限内のカードがあるかチェック
    const now = new Date()
    let hasActiveCard = false
    let remainingSeconds = 0
    
    for (const card of activeCards) {
      if (!card.expires_at) continue
      const expiresAt = new Date(card.expires_at)
      if (expiresAt > now) {
        hasActiveCard = true
        const remaining = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)
        if (remaining > remainingSeconds) {
          remainingSeconds = remaining
        }
      }
    }

    return NextResponse.json({ isHidden: hasActiveCard, remainingSeconds })
  } catch (error) {
    console.error('Hide prices check error:', error)
    return NextResponse.json({ isHidden: false })
  }
}

