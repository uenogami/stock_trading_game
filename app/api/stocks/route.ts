import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameRules } from '@/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: stocks, error } = await supabase
      .from('stocks')
      .select('*')
      .order('symbol')

    if (error) {
      console.error('Get stocks error from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 全取引履歴を取得（チャートデータ生成用）
    const { data: allTrades } = await supabase
      .from('trades')
      .select('symbol, type, quantity, created_at')
      .order('created_at', { ascending: true })

    const globalGameStartTime = allTrades && allTrades.length > 0
      ? new Date(allTrades[0].created_at)
      : new Date()

    // チャートデータを生成（取引履歴に基づく）
    const stocksWithChart = await Promise.all(stocks?.map(async (stock) => {
      // ルールから説明文を取得
      const stockRule = gameRules.stocks.find((s) => s.symbol === stock.symbol)
      
      // 該当銘柄の取引履歴を取得
      const symbolTrades = (allTrades || []).filter(t => t.symbol === stock.symbol)
      
      const chartSeries: Array<{ time: string; price: number; minute: number }> = []
      const initialPrice = stock.initial_price || 100
      const gameDuration = gameRules.playTime
      
      for (let minute = 0; minute <= gameDuration; minute++) {
        let cumulativeBuyCount = 0
        let cumulativeSellCount = 0
        
        symbolTrades.forEach(trade => {
          const tradeTime = new Date(trade.created_at)
          const tradeMinute = Math.floor((tradeTime.getTime() - globalGameStartTime.getTime()) / (60 * 1000))
          if (tradeMinute >= 0 && tradeMinute <= minute) {
            if (trade.type === 'buy') {
              cumulativeBuyCount += trade.quantity
            } else {
              cumulativeSellCount += trade.quantity
            }
          }
        })
        
        const priceChange = (cumulativeBuyCount - cumulativeSellCount) * stock.coefficient
        const price = Math.max(1, initialPrice + priceChange)
        
        chartSeries.push({
          time: `${minute}分`,
          minute: minute,
          price: Math.round(price * 10) / 10,
        })
      }
      
      const changeRate = initialPrice > 0 
        ? ((stock.price - initialPrice) / initialPrice) * 100 
        : 0;

      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change24h: Math.round(changeRate * 10) / 10, // ゲーム開始からの変化率
        volume: stock.volume || 0,
        chartSeries,
        coefficient: stock.coefficient,
        maxHoldings: stock.max_holdings,
        description: stockRule?.description || '',
      };
    }) || [])

    return NextResponse.json({ stocks: stocksWithChart || [] })
  } catch (error) {
    console.error('Get stocks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

