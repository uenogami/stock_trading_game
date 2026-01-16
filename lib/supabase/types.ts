// データベースの型定義
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          cash: number
          holdings: { [symbol: string]: number }
          insurance_used: boolean
          password_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          cash: number
          holdings?: { [symbol: string]: number }
          insurance_used?: boolean
          password_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          cash?: number
          holdings?: { [symbol: string]: number }
          insurance_used?: boolean
          password_hash?: string | null
          updated_at?: string
        }
      }
      stocks: {
        Row: {
          symbol: string
          name: string
          price: number
          change24h: number
          volume: number
          coefficient: number
          max_holdings: number
          initial_price: number
          updated_at: string
        }
        Insert: {
          symbol: string
          name: string
          price: number
          change24h?: number
          volume?: number
          coefficient: number
          max_holdings: number
          initial_price: number
          updated_at?: string
        }
        Update: {
          symbol?: string
          name?: string
          price?: number
          change24h?: number
          volume?: number
          coefficient?: number
          max_holdings?: number
          initial_price?: number
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: 'buy' | 'sell'
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: 'buy' | 'sell'
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          type?: 'buy' | 'sell'
          quantity?: number
          price?: number
        }
      }
      timeline_posts: {
        Row: {
          id: string
          user_id: string
          user_name: string
          type: 'rumor' | 'analysis' | 'claim' | 'trade-log' | 'tweet' | 'system'
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name: string
          type: 'rumor' | 'analysis' | 'claim' | 'trade-log' | 'tweet' | 'system'
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string
          type?: 'rumor' | 'analysis' | 'claim' | 'trade-log' | 'tweet' | 'system'
          text?: string
        }
      }
      user_cards: {
        Row: {
          id: string
          user_id: string
          card_id: string
          purchased: boolean
          active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          purchased?: boolean
          active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          purchased?: boolean
          active?: boolean
          expires_at?: string | null
        }
      }
    }
  }
}

