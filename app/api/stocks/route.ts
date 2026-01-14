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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // チャートデータを生成（簡易版：過去7日分）
    const stocksWithChart = stocks?.map((stock) => {
      // ルールから説明文を取得
      const stockRule = gameRules.stocks.find((s) => s.symbol === stock.symbol)
      const chartSeries = []
      const basePrice = stock.initial_price || stock.price
      let currentPrice = basePrice * 0.9

      for (let i = 7; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1)
        chartSeries.push({
          time: date.toISOString().split('T')[0],
          price: Math.round(currentPrice * 10) / 10,
        })
      }
      // 最後の価格を現在価格に合わせる
      chartSeries[chartSeries.length - 1].price = stock.price

      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change24h: stock.change24h || 0,
        volume: stock.volume || 0,
        chartSeries,
        coefficient: stock.coefficient,
        maxHoldings: stock.max_holdings,
        description: stockRule?.description || '',
      }
    })

    return NextResponse.json({ stocks: stocksWithChart || [] })
  } catch (error) {
    console.error('Get stocks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

