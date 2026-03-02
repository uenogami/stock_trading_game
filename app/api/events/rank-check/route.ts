import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 順位確認イベント（10分、20分、30分、50分）
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const eventTimeMinutes = parseInt(searchParams.get('time') || '0', 10)

    if (!eventTimeMinutes || ![10, 20, 30, 50].includes(eventTimeMinutes)) {
      return NextResponse.json({ error: 'Invalid event time' }, { status: 400 })
    }

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

    if (elapsedSeconds < eventTimeMinutes * 60) {
      return NextResponse.json({ error: 'Event time has not been reached' }, { status: 400 })
    }

    // イベントごとのメッセージ
    const messages: { [key: number]: string } = {
      10: '10分経過：自分の順位確認が可能になりました',
      20: '20分経過：自分の上下順位との資産差確認が可能になりました',
      30: '30分経過：全体の順位のみ確認可能になりました（保有資産は非表示）',
      50: '50分経過：自分の順位と上下順位との資産差確認が可能になりました',
    }

    const eventTime = new Date(gameStartTime.getTime() + eventTimeMinutes * 60 * 1000)
    const message = messages[eventTimeMinutes]
    
    const { data: existingPost } = await supabase
      .from('timeline_posts')
      .select('id')
      .eq('type', 'system')
      .eq('text', message)
      .gte('created_at', eventTime.toISOString())
      .limit(1)
      .maybeSingle()

    if (existingPost) {
      return NextResponse.json({ 
        success: true, 
        message: 'Event already applied',
      })
    }

    const { data: systemUser } = await supabase
      .from('users')
      .select('id, name')
      .limit(1)
      .maybeSingle()
    
    if (!systemUser) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 })
    }

    const { error: timelineError } = await supabase
      .from('timeline_posts')
      .insert({
        user_id: systemUser.id,
        user_name: 'システム',
        type: 'system',
        text: message,
      })
    
    if (timelineError) {
      console.error('Timeline post error:', timelineError);
      const { data: recheckPost } = await supabase
        .from('timeline_posts')
        .select('id')
        .eq('type', 'system')
        .eq('text', message)
        .gte('created_at', eventTime.toISOString())
        .limit(1)
        .maybeSingle()
      
      if (recheckPost) {
        return NextResponse.json({ 
          success: true, 
          message: 'Event already applied',
        })
      }
      return NextResponse.json(
        { error: 'Failed to post timeline notification', details: timelineError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
    })
  } catch (error) {
    console.error('Rank check event error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
