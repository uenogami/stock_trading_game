import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 60分経過時のゲーム終了処理
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ゲーム開始時刻を取得
    const { data: firstTrade } = await supabase
      .from('trades')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!firstTrade) {
      return NextResponse.json({ error: 'Game has not started' }, { status: 400 })
    }

    const gameStartTime = new Date(firstTrade.created_at)
    const elapsedSeconds = (Date.now() - gameStartTime.getTime()) / 1000
    const gameEndMinutes = 60

    if (elapsedSeconds < gameEndMinutes * 60) {
      return NextResponse.json({ error: 'Game end time has not been reached' }, { status: 400 })
    }

    // 既に適用済みかチェック（タイムライン投稿の存在で判定）
    const eventTime = new Date(gameStartTime.getTime() + gameEndMinutes * 60 * 1000)
    const { data: existingPost } = await supabase
      .from('timeline_posts')
      .select('id')
      .eq('type', 'system')
      .eq('text', 'ゲーム終了')
      .gte('created_at', eventTime.toISOString())
      .limit(1)
      .maybeSingle()

    if (existingPost) {
      return NextResponse.json({ 
        success: true, 
        message: 'Game end event already applied',
      })
    }

    // システム用ユーザーIDを取得
    const { data: systemUser } = await supabase
      .from('users')
      .select('id, name')
      .limit(1)
      .maybeSingle()
    
    if (!systemUser) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 })
    }

    // タイムラインに通知を投稿
    const { error: timelineError } = await supabase
      .from('timeline_posts')
      .insert({
        user_id: systemUser.id,
        user_name: 'システム',
        type: 'system',
        text: 'ゲーム終了',
      })
    
    if (timelineError) {
      console.error('Timeline post error:', timelineError);
      const { data: recheckPost } = await supabase
        .from('timeline_posts')
        .select('id')
        .eq('type', 'system')
        .eq('text', 'ゲーム終了')
        .gte('created_at', eventTime.toISOString())
        .limit(1)
        .maybeSingle()
      
      if (recheckPost) {
        return NextResponse.json({ 
          success: true, 
          message: 'Game end event already applied',
        })
      }
      return NextResponse.json(
        { error: 'Failed to post timeline notification', details: timelineError.message },
        { status: 500 }
      )
    }

    // 全ユーザーを取得
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, cash')

    if (usersError) {
      console.error('Get users error:', usersError)
      return NextResponse.json(
        { error: 'Failed to get users', details: usersError.message },
        { status: 500 }
      )
    }

    // 現金1.1倍カードを持っているユーザーを取得
    const { data: cashMultiplierCards } = await supabase
      .from('user_cards')
      .select('user_id')
      .eq('card_id', 'cash-multiplier')
      .eq('purchased', true)

    const cashMultiplierUserIds = new Set((cashMultiplierCards || []).map(c => c.user_id))

    // 現金1.1倍カードを持っているユーザーの現金を1.1倍に更新
    const updatePromises = (allUsers || [])
      .filter(user => cashMultiplierUserIds.has(user.id))
      .map((user) => {
        const newCash = Math.floor((user.cash || 0) * 1.1)
        return supabase
          .from('users')
          .update({
            cash: newCash,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      })

    const results = await Promise.all(updatePromises)
    const errors = results.filter((r) => r.error)

    if (errors.length > 0) {
      console.error('Some users failed to update:', errors)
      return NextResponse.json(
        { error: 'Some users failed to update', details: errors.map((e) => e.error?.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      usersUpdated: updatePromises.length,
      cashMultiplierApplied: updatePromises.length > 0,
    })
  } catch (error) {
    console.error('Game end event error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

