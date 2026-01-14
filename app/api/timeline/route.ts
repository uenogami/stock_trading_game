import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: posts, error } = await supabase
      .from('timeline_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Timeline error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, type, text } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    if (!type || !text) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // ユーザー情報を取得
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    const { data: post, error } = await supabase
      .from('timeline_posts')
      .insert({
        user_id: userId,
        user_name: userData?.name || 'Unknown',
        type,
        text,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Timeline post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

