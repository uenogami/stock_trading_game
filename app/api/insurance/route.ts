import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gameRules } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
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

    // 保険使用済みかチェック
    if (userData.insurance_used) {
      return NextResponse.json(
        { error: '保険は既に使用済みです' },
        { status: 400 }
      )
    }

    // 株価情報を取得（総資産計算用）
    const { data: stocks } = await supabase
      .from('stocks')
      .select('symbol, price')

    // 総資産を計算
    const holdingsValue = Object.entries(userData.holdings || {}).reduce(
      (sum, [symbol, qty]: [string, any]) => {
        const stock = stocks?.find((s) => s.symbol === symbol)
        return sum + (qty || 0) * (stock?.price || 0)
      },
      0
    )
    const totalAsset = userData.cash + holdingsValue

    // 保険発動条件チェック（総資産が1000p以下）
    if (totalAsset > gameRules.insurance.threshold) {
      return NextResponse.json(
        { error: `保険は総資産が${gameRules.insurance.threshold}p以下の場合のみ発動可能です` },
        { status: 400 }
      )
    }

    // 保険発動（2000p付与）
    const newCash = userData.cash + gameRules.insurance.amount

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        cash: newCash,
        insurance_used: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: '保険発動に失敗しました' },
        { status: 500 }
      )
    }

    // タイムラインに自動投稿
    await supabase.from('timeline_posts').insert({
      user_id: userId,
      user_name: userData.name,
      type: 'claim',
      text: `${userData.name}が保険を発動しました（+${gameRules.insurance.amount}p）`,
    })

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        insuranceUsed: updatedUser.insurance_used,
      },
    })
  } catch (error) {
    console.error('Insurance activation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

