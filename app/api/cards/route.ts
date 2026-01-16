import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameRules } from '@/config'

// カード購入
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, cardId, action } = body // action: 'buy' or 'use'

    if (!userId || !cardId || !action) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // カード情報を取得
    const card = gameRules.cards.find((c) => c.id === cardId)
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'buy') {
      // ゲーム終了チェック（60分経過後はカード購入不可）
      const { data: firstTrade } = await supabase
        .from('trades')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (firstTrade) {
        const gameStartTime = new Date(firstTrade.created_at)
        const elapsedSeconds = (Date.now() - gameStartTime.getTime()) / 1000
        const gameEndMinutes = 60

        if (elapsedSeconds >= gameEndMinutes * 60) {
          return NextResponse.json({ error: 'ゲームは終了しました' }, { status: 400 })
        }
      }

      // 既に購入済みかチェック
      const { data: existingCard } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .maybeSingle()

      if (existingCard && existingCard.purchased) {
        return NextResponse.json({ error: 'Card already purchased' }, { status: 400 })
      }

      // 現金チェック
      if (userData.cash < card.price) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
      }

      // 前提条件チェック
      if (card.requiresPrerequisite && card.prerequisiteCardId) {
        const { data: prerequisiteCard } = await supabase
          .from('user_cards')
          .select('*')
          .eq('user_id', userId)
          .eq('card_id', card.prerequisiteCardId)
          .maybeSingle()
        
        if (!prerequisiteCard || !prerequisiteCard.purchased) {
          return NextResponse.json({ error: '前提条件のカードが購入されていません' }, { status: 400 })
        }
      }

      // カードを購入（購入時はactive: false、ユーザーが発動する）
      const { error: cardError } = await supabase
        .from('user_cards')
        .upsert({
          user_id: userId,
          card_id: cardId,
          purchased: true,
          active: false, // 購入時は未発動
          expires_at: null, // 発動時に設定
        }, {
          onConflict: 'user_id,card_id'
        })

      if (cardError) {
        console.error('Card purchase error:', cardError)
        return NextResponse.json(
          { error: 'Failed to purchase card', details: cardError.message },
          { status: 500 }
        )
      }

      // ユーザーの現金を減らす
      const { error: updateError } = await supabase
        .from('users')
        .update({
          cash: userData.cash - card.price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        console.error('User update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user cash', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    } else if (action === 'activate') {
      // カードを発動
      const { data: userCard } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .maybeSingle()

      if (!userCard || !userCard.purchased) {
        return NextResponse.json({ error: 'カードが購入されていません' }, { status: 400 })
      }

      if (userCard.active) {
        return NextResponse.json({ error: '既に発動中です' }, { status: 400 })
      }

      // 発動時に有効期限を設定（時間制限のあるカードのみ）
      let expiresAt = null
      if (cardId === 'hide-prices') {
        // 株価非表示カード：2分間有効
        expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()
      }

      // 偽情報投稿カードは発動時に投稿フォームを表示する必要があるため、特別処理は不要
      // （購入時に投稿済みのため）

      const { error: activateError } = await supabase
        .from('user_cards')
        .update({
          active: true,
          expires_at: expiresAt,
        })
        .eq('user_id', userId)
        .eq('card_id', cardId)

      if (activateError) {
        console.error('Card activate error:', activateError)
        return NextResponse.json(
          { error: 'Failed to activate card', details: activateError.message },
          { status: 500 }
        )
      }

      // 株価非表示カード発動時にタイムラインに通知（利用者は明記しない）
      if (cardId === 'hide-prices') {
        const { error: timelineError } = await supabase
          .from('timeline_posts')
          .insert({
            user_id: userId,
            user_name: 'システム',
            type: 'system',
            text: '株価が非表示になりました（2分間）',
          })

        if (timelineError) {
          console.error('Timeline post error:', timelineError)
          // タイムライン投稿の失敗は無視（カード発動は成功）
        }
      }

      return NextResponse.json({ success: true, expiresAt })
    } else if (action === 'expire') {
      // カードの有効期限切れを処理
      const { error: expireError } = await supabase
        .from('user_cards')
        .update({
          active: false,
        })
        .eq('user_id', userId)
        .eq('card_id', cardId)

      if (expireError) {
        console.error('Card expire error:', expireError)
        return NextResponse.json(
          { error: 'Failed to expire card', details: expireError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Card API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

// ユーザーのカード一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: userCards, error } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Get user cards error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cards: userCards || [] })
  } catch (error) {
    console.error('Get cards error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

