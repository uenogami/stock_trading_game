import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { User, Stock, TimelinePost } from '@/fixtures/mockData'
import { gameRules } from '@/config'

interface Card {
  id: string
  name: string
  price: number
  purchased: boolean
  active?: boolean
  expiresAt?: number
}

interface GameState {
  // ユーザー状態
  user: User | null
  // 株価データ
  stocks: Stock[]
  // タイムラインポスト
  timelinePosts: TimelinePost[]
  // カードシステム
  cards: Card[]
  // クールダウン管理
  lastTradeTime: number | null
  cooldownMinutes: number
  // ローディング状態
  loading: boolean
  // 初期化
  initialize: () => Promise<void>
  // 購入アクション
  buyStock: (symbol: string, quantity: number) => Promise<void>
  // 売却アクション
  sellStock: (symbol: string, quantity: number) => Promise<void>
  // 総資産を計算
  calculateTotalAsset: () => number
  // クールダウン残り時間を取得（秒）
  getCooldownRemaining: () => number
  // 保険を発動
  activateInsurance: () => Promise<void>
  // タイムラインに投稿を追加
  addTimelinePost: (post: Omit<TimelinePost, 'id' | 'createdAt'>) => Promise<void>
  // リアルタイム同期を開始
  subscribeRealtime: () => () => void
}

export const useGameStoreServer = create<GameState>((set, get) => ({
  user: null,
  stocks: [],
  timelinePosts: [],
  cards: [],
  lastTradeTime: null,
  cooldownMinutes: gameRules.trading.cooldownMinutes,
  loading: true,

  // 初期化
  initialize: async () => {
    const supabase = createClient()
    set({ loading: true })

    try {
      // 認証ユーザーを取得
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        throw new Error('Not authenticated')
      }

      // ユーザーデータを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        // ユーザーが存在しない場合は作成
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            name: authUser.email?.split('@')[0] || 'Player',
            email: authUser.email,
            cash: gameRules.initialCash,
            holdings: gameRules.initialHoldings,
          })
          .select()
          .single()

        if (newUser) {
          set({
            user: {
              id: newUser.id,
              name: newUser.name,
              cash: newUser.cash,
              holdings: newUser.holdings || {},
              insuranceUsed: newUser.insurance_used,
              delta24h: 0,
            },
          })
        }
      } else if (userData) {
        set({
          user: {
            id: userData.id,
            name: userData.name,
            cash: userData.cash,
            holdings: userData.holdings || {},
            insuranceUsed: userData.insurance_used,
            delta24h: 0,
          },
        })
      }

      // 株価データを取得
      const { data: stocksData } = await supabase
        .from('stocks')
        .select('*')
        .order('symbol')

      if (stocksData) {
        const stocks: Stock[] = stocksData.map((s) => ({
          symbol: s.symbol,
          name: s.name,
          price: s.price,
          change24h: s.change24h || 0,
          volume: s.volume || 0,
          coefficient: s.coefficient,
          maxHoldings: s.max_holdings,
          chartSeries: [], // チャートデータは別途取得
          description: '',
          flavor: {
            type: '',
            industry: '',
            characteristics: [],
          },
        }))
        set({ stocks })
      }

      // タイムラインポストを取得
      const { data: postsData } = await supabase
        .from('timeline_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (postsData) {
        const timelinePosts: TimelinePost[] = postsData.map((p) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          type: p.type,
          text: p.text,
          createdAt: new Date(p.created_at),
        }))
        set({ timelinePosts })
      }

      // 最後の取引時刻を取得
      const { data: lastTrade } = await supabase
        .from('trades')
        .select('created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastTrade) {
        set({ lastTradeTime: new Date(lastTrade.created_at).getTime() })
      }

      set({ loading: false })
    } catch (error) {
      console.error('Initialize error:', error)
      set({ loading: false })
    }
  },

  // 購入アクション
  buyStock: async (symbol: string, quantity: number) => {
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, type: 'buy', quantity }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to buy stock')
    }

    // 状態を更新
    await get().initialize()
  },

  // 売却アクション
  sellStock: async (symbol: string, quantity: number) => {
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, type: 'sell', quantity }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sell stock')
    }

    // 状態を更新
    await get().initialize()
  },

  // 総資産を計算
  calculateTotalAsset: () => {
    const { user, stocks } = get()
    if (!user) return 0

    const stockPrices: { [symbol: string]: number } = {}
    stocks.forEach((stock) => {
      stockPrices[stock.symbol] = stock.price
    })

    const holdingsValue = Object.entries(user.holdings).reduce(
      (sum, [symbol, quantity]) => {
        return sum + quantity * (stockPrices[symbol] || 0)
      },
      0
    )

    return user.cash + holdingsValue
  },

  // クールダウン残り時間を取得（秒）
  getCooldownRemaining: () => {
    const { lastTradeTime, cooldownMinutes } = get()
    if (!lastTradeTime) return 0

    const elapsed = (Date.now() - lastTradeTime) / 1000
    const cooldownSeconds = cooldownMinutes * 60
    const remaining = cooldownSeconds - elapsed
    return Math.max(0, Math.ceil(remaining))
  },

  // 保険を発動
  activateInsurance: async () => {
    const { user } = get()
    if (!user) return

    const totalAsset = get().calculateTotalAsset()
    if (totalAsset > gameRules.insurance.threshold || user.insuranceUsed) {
      throw new Error('Insurance cannot be activated')
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('users')
      .update({
        cash: user.cash + gameRules.insurance.amount,
        insurance_used: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)

    await get().initialize()
  },

  // タイムラインに投稿を追加
  addTimelinePost: async (post: Omit<TimelinePost, 'id' | 'createdAt'>) => {
    const response = await fetch('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add post')
    }

    // 状態を更新
    const { data } = await response.json()
    set((state) => ({
      timelinePosts: [data.post, ...state.timelinePosts].slice(0, 50),
    }))
  },

  // リアルタイム同期を開始
  subscribeRealtime: () => {
    const supabase = createClient()

    // 株価の変更を監視
    const stocksSubscription = supabase
      .channel('stocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stocks',
        },
        async () => {
          // 株価を再取得
          const { data: stocksData } = await supabase
            .from('stocks')
            .select('*')
            .order('symbol')

          if (stocksData) {
            const stocks: Stock[] = stocksData.map((s) => ({
              symbol: s.symbol,
              name: s.name,
              price: s.price,
              change24h: s.change24h || 0,
              volume: s.volume || 0,
              coefficient: s.coefficient,
              maxHoldings: s.max_holdings,
              chartSeries: [],
              description: '',
              flavor: {
                type: '',
                industry: '',
                characteristics: [],
              },
            }))
            set({ stocks })
          }
        }
      )
      .subscribe()

    // タイムラインの変更を監視
    const timelineSubscription = supabase
      .channel('timeline-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timeline_posts',
        },
        async (payload) => {
          const newPost = payload.new as any
          const timelinePost: TimelinePost = {
            id: newPost.id,
            userId: newPost.user_id,
            userName: newPost.user_name,
            type: newPost.type,
            text: newPost.text,
            createdAt: new Date(newPost.created_at),
          }
          set((state) => ({
            timelinePosts: [timelinePost, ...state.timelinePosts].slice(0, 50),
          }))
        }
      )
      .subscribe()

    // 取引の変更を監視（ユーザー情報を更新）
    const tradesSubscription = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        async () => {
          // ユーザー情報を再取得
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single()

            if (userData) {
              set({
                user: {
                  id: userData.id,
                  name: userData.name,
                  cash: userData.cash,
                  holdings: userData.holdings || {},
                  insuranceUsed: userData.insurance_used,
                  delta24h: 0,
                },
              })
            }
          }
        }
      )
      .subscribe()

    // クリーンアップ関数
    return () => {
      stocksSubscription.unsubscribe()
      timelineSubscription.unsubscribe()
      tradesSubscription.unsubscribe()
    }
  },
}))

