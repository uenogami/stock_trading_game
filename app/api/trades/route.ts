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
      if (currentHoldings + quantity > stock.max_holdings) {
        return NextResponse.json(
          { error: 'Exceeds max holdings' },
          { status: 400 }
        )
      }

      // 購入処理
      const newCash = userData.cash - totalCost
      const newHoldings = {
        ...userData.holdings,
        [symbol]: (currentHoldings || 0) + quantity,
      }

      await supabase
        .from('users')
        .update({
          cash: newCash,
          holdings: newHoldings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
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

      await supabase
        .from('users')
        .update({
          cash: newCash,
          holdings: newHoldings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
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
      return NextResponse.json(
        { error: 'Failed to record trade' },
        { status: 500 }
      )
    }

    // 株価を更新（買い注文数 - 売り注文数の差分 × 係数）
    const { data: recentTrades } = await supabase
      .from('trades')
      .select('type, quantity')
      .eq('symbol', symbol)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    let buyCount = 0
    let sellCount = 0
    recentTrades?.forEach((t) => {
      if (t.type === 'buy') buyCount += t.quantity
      else sellCount += t.quantity
    })

    const priceChange = (buyCount - sellCount) * stock.coefficient
    const newPrice = stock.initial_price + priceChange

    await supabase
      .from('stocks')
      .update({
        price: newPrice,
        volume: (stock.volume || 0) + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('symbol', symbol)

    // タイムラインに自動投稿
    await supabase.from('timeline_posts').insert({
      user_id: userId,
      user_name: userData.name,
      type: 'trade-log',
      text: `${userData.name}が${stock.name}を${quantity}株${type === 'buy' ? '購入' : '売却'}しました`,
    })

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    console.error('Trade error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

