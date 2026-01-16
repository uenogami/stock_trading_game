import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 全ユーザーの順位を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // 全ユーザーを取得（重複を除外）
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, cash, holdings')
      .order('created_at', { ascending: true })

    if (usersError) {
      console.error('Get users error:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // 重複ユーザー名を除外（最新のもの以外を除外）
    const uniqueUsers = (users || []).reduce((acc, user) => {
      const existing = acc.find((u) => u.name === user.name)
      if (!existing) {
        acc.push(user)
      } else {
        // 同じ名前が既にある場合、より新しいIDを優先（通常は後から作成されたもの）
        const existingIndex = acc.findIndex((u) => u.name === user.name)
        if (existingIndex !== -1) {
          acc[existingIndex] = user
        }
      }
      return acc
    }, [] as typeof users)

    // 全銘柄の現在価格を取得
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol, price')

    if (stocksError) {
      console.error('Get stocks error:', stocksError)
      return NextResponse.json({ error: stocksError.message }, { status: 500 })
    }

    // 株価マップを作成
    const stockPriceMap: { [symbol: string]: number } = {}
    stocks?.forEach((stock) => {
      stockPriceMap[stock.symbol] = stock.price
    })

    // 各ユーザーの総資産を計算
    const rankings = uniqueUsers.map((user) => {
      const holdings = (user.holdings as { [symbol: string]: number }) || {}
      const holdingsValue = Object.entries(holdings).reduce(
        (sum, [symbol, qty]) => {
          return sum + (qty || 0) * (stockPriceMap[symbol] || 0)
        },
        0
      )
      const totalAsset = (user.cash || 0) + holdingsValue

      return {
        userId: user.id,
        userName: user.name,
        totalAsset,
        cash: user.cash || 0,
        holdingsValue,
      }
    })

    // 総資産の降順でソート
    rankings.sort((a, b) => b.totalAsset - a.totalAsset)

    // 順位を付与
    const rankingsWithRank = rankings.map((user, index) => ({
      ...user,
      rank: index + 1,
    }))

    // 特定ユーザーの順位を取得
    if (userId) {
      const userRanking = rankingsWithRank.find((r) => r.userId === userId)
      const userRankIndex = rankingsWithRank.findIndex((r) => r.userId === userId)
      
      // 上下の順位のプレーヤーを取得
      const upperRank = userRankIndex > 0 ? rankingsWithRank[userRankIndex - 1] : null
      const lowerRank = userRankIndex < rankingsWithRank.length - 1 ? rankingsWithRank[userRankIndex + 1] : null
      
      return NextResponse.json({
        rankings: rankingsWithRank,
        userRank: userRanking?.rank || null,
        totalUsers: rankingsWithRank.length,
        upperRank: upperRank ? {
          rank: upperRank.rank,
          userName: upperRank.userName,
          totalAsset: upperRank.totalAsset,
          difference: userRanking ? userRanking.totalAsset - upperRank.totalAsset : 0,
        } : null,
        lowerRank: lowerRank ? {
          rank: lowerRank.rank,
          userName: lowerRank.userName,
          totalAsset: lowerRank.totalAsset,
          difference: userRanking ? lowerRank.totalAsset - userRanking.totalAsset : 0,
        } : null,
      })
    }

    return NextResponse.json({
      rankings: rankingsWithRank,
      totalUsers: rankingsWithRank.length,
    })
  } catch (error) {
    console.error('Rankings API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

