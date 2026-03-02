import { createClient } from '@/lib/supabase/server'

/**
 * ゲーム開始時刻を取得
 */
export async function getGameStartTime(supabase: ReturnType<typeof createClient>) {
  const { data: firstTrade } = await supabase
    .from('trades')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return firstTrade ? new Date(firstTrade.created_at) : null
}

/**
 * ゲームが終了しているかチェック（60分経過後）
 */
export async function isGameEnded(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const gameStartTime = await getGameStartTime(supabase)
  if (!gameStartTime) return false

  const elapsedSeconds = (Date.now() - gameStartTime.getTime()) / 1000
  const gameEndMinutes = 60
  return elapsedSeconds >= gameEndMinutes * 60
}
