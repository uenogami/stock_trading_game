import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 50分経過時（残り10分）のラストスパート通知
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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
    const eventTimeMinutes = 55

    if (elapsedSeconds < eventTimeMinutes * 60) {
      return NextResponse.json({ error: 'Event time has not been reached' }, { status: 400 })
    }

    const eventTime = new Date(gameStartTime.getTime() + eventTimeMinutes * 60 * 1000)
    const { data: existingPost } = await supabase
      .from('timeline_posts')
      .select('id')
      .eq('type', 'system')
      .eq('text', '残り5分！ラストスパートをかけましょう！')
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
        text: '残り5分！ラストスパートをかけましょう！',
      })
    
    if (timelineError) {
      console.error('Timeline post error:', timelineError);
      const { data: recheckPost } = await supabase
        .from('timeline_posts')
        .select('id')
        .eq('type', 'system')
        .eq('text', '残り5分！ラストスパートをかけましょう！')
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
    console.error('Last spurt event error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
