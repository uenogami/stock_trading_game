import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameRules } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, symbol, type, quantity } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    if (!symbol || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // ゲーム終了チェック（60分経過後は取引不可）
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

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 株価情報を取得
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (stockError || !stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    // クールダウンチェック（簡易版：1分間）
    const { data: lastTrade } = await supabase
      .from('trades')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastTrade) {
      const lastTradeTime = new Date(lastTrade.created_at).getTime()
      const cooldownMinutes = gameRules.trading.cooldownMinutes
      const cooldownMs = cooldownMinutes * 60 * 1000
      if (Date.now() - lastTradeTime < cooldownMs) {
        return NextResponse.json(
          { error: 'Cooldown period active' },
          { status: 429 }
        )
      }
    }

    // 取引の検証
    if (type === 'buy') {
      const totalCost = stock.price * quantity
      if (userData.cash < totalCost) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
      }

      const currentHoldings = userData.holdings?.[symbol] || 0
      
      // 保有上限増加カードの効果を適用（+10株）
      const { data: maxHoldingsCard } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('card_id', 'max-holdings-plus')
        .eq('active', true)
        .maybeSingle()
      
      const effectiveMaxHoldings = stock.max_holdings + (maxHoldingsCard ? 10 : 0)

      if (currentHoldings + quantity > effectiveMaxHoldings) {
        return NextResponse.json(
          { error: `Maximum holdings exceeded. Max: ${effectiveMaxHoldings}` },
          { status: 400 }
        )
      }

      // 購入処理
      const newCash = userData.cash - totalCost
      const newHoldings = {
        ...userData.holdings,
        [symbol]: (currentHoldings || 0) + quantity,
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          cash: newCash,
          holdings: newHoldings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('User update error:', userUpdateError)
        return NextResponse.json(
          { error: 'Failed to update user data', details: userUpdateError.message },
          { status: 500 }
        )
      }
    } else if (type === 'sell') {
      const currentHoldings = userData.holdings?.[symbol] || 0
      if (currentHoldings < quantity) {
        return NextResponse.json(
          { error: 'Insufficient holdings' },
          { status: 400 }
        )
      }

      // 売却処理
      const revenue = stock.price * quantity
      const newCash = userData.cash + revenue
      const newHoldings = {
        ...userData.holdings,
        [symbol]: currentHoldings - quantity,
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          cash: newCash,
          holdings: newHoldings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('User update error:', userUpdateError)
        return NextResponse.json(
          { error: 'Failed to update user data', details: userUpdateError.message },
          { status: 500 }
        )
      }
    }

    // 取引履歴を記録
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        symbol,
        type,
        quantity,
        price: stock.price,
      })
      .select()
      .single()

    if (tradeError) {
      console.error('Trade insert error:', tradeError)
      return NextResponse.json(
        { error: 'Failed to record trade', details: tradeError.message },
        { status: 500 }
      )
    }

    // 株価を更新（買い注文数 - 売り注文数の差分 × 係数）
    // 全期間の取引履歴を集計（24時間制限を削除）
    const { data: allTrades } = await supabase
      .from('trades')
      .select('type, quantity')
      .eq('symbol', symbol)

    let buyCount = 0
    let sellCount = 0
    allTrades?.forEach((t) => {
      if (t.type === 'buy') buyCount += t.quantity
      else sellCount += t.quantity
    })

    // initial_priceが正しく設定されていない場合に備えて、100をデフォルト値として使用
    // ただし、initial_priceがnullやundefinedの場合は、ルールから取得
    const basePrice = stock.initial_price ?? 100
    const priceChange = (buyCount - sellCount) * stock.coefficient
    const newPrice = Math.max(1, Math.round(basePrice + priceChange)) // 最低1p、整数に丸める

    // 株価を更新（エラーチェック付き）
    const { error: updateError } = await supabase
      .from('stocks')
      .update({
        price: newPrice,
        volume: (stock.volume || 0) + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('symbol', symbol)

    if (updateError) {
      console.error(`[${symbol}] 株価更新エラー:`, updateError)
      return NextResponse.json(
        { error: 'Failed to update stock price', details: updateError.message },
        { status: 500 }
      )
    }

    // 匿名売買ログカードがアクティブかチェック
    const { data: anonymousCard } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', 'anonymous-trade')
      .eq('active', true)
      .maybeSingle()

    // タイムラインに自動投稿（エラーは無視）
    const displayName = anonymousCard ? '匿名ユーザー' : userData.name;
    const { error: timelineError } = await supabase.from('timeline_posts').insert({
      user_id: userId,
      user_name: displayName,
      type: 'trade-log',
      text: `${displayName}が${stock.name}を${quantity}株${type === 'buy' ? '購入' : '売却'}しました`,
    })

    // 匿名カードを使用した場合、カードを無効化（1回のみ使用可能）
    if (anonymousCard) {
      await supabase
        .from('user_cards')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('card_id', 'anonymous-trade')
    }
    
    if (timelineError) {
      console.error('Timeline post error:', timelineError)
      // タイムライン投稿のエラーは取引を失敗させない
    }

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    console.error('Trade error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

