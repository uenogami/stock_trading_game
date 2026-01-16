import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const eventTimeMinutes = 40

    if (elapsedSeconds < eventTimeMinutes * 60) {
      return NextResponse.json({ error: 'Event time has not been reached' }, { status: 400 })
    }

    const eventTime = new Date(gameStartTime.getTime() + eventTimeMinutes * 60 * 1000)
    const { data: existingPost } = await supabase
      .from('timeline_posts')
      .select('id')
      .eq('type', 'system')
      .eq('text', '保有現金×1.2倍イベントが発動しました')
      .gte('created_at', eventTime.toISOString())
      .limit(1)
      .maybeSingle()

    if (existingPost) {
      return NextResponse.json({ 
        success: true, 
        message: 'Event already applied',
        usersUpdated: 0 
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
        text: '保有現金×1.2倍イベントが発動しました',
      })
    
    if (timelineError) {
      console.error('Timeline post error:', timelineError);
      const { data: recheckPost } = await supabase
        .from('timeline_posts')
        .select('id')
        .eq('type', 'system')
        .eq('text', '保有現金×1.2倍イベントが発動しました')
        .gte('created_at', eventTime.toISOString())
        .limit(1)
        .maybeSingle()
      
      if (recheckPost) {
        return NextResponse.json({ 
          success: true, 
          message: 'Event already applied',
          usersUpdated: 0 
        })
      }
      return NextResponse.json(
        { error: 'Failed to post timeline notification', details: timelineError.message },
        { status: 500 }
      )
    }

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

    const updatePromises = (allUsers || []).map((user) => {
      const newCash = Math.floor((user.cash || 0) * 1.2)
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
      usersUpdated: allUsers?.length || 0 
    })
  } catch (error) {
    console.error('Cash multiplier event error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

