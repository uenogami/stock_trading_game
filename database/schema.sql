-- Supabaseデータベーススキーマ

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  cash INTEGER NOT NULL DEFAULT 5000,
  holdings JSONB DEFAULT '{}'::jsonb,
  insurance_used BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 株価テーブル
CREATE TABLE IF NOT EXISTS stocks (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  change24h NUMERIC DEFAULT 0,
  volume INTEGER DEFAULT 0,
  coefficient NUMERIC NOT NULL,
  max_holdings INTEGER NOT NULL,
  initial_price INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 取引履歴テーブル
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES stocks(symbol),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- タイムラインポストテーブル
CREATE TABLE IF NOT EXISTS timeline_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rumor', 'analysis', 'claim', 'trade-log', 'tweet')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存のテーブルの制約を更新（既にテーブルが存在する場合）
ALTER TABLE timeline_posts DROP CONSTRAINT IF EXISTS timeline_posts_type_check;
ALTER TABLE timeline_posts ADD CONSTRAINT timeline_posts_type_check 
  CHECK (type IN ('rumor', 'analysis', 'claim', 'trade-log', 'tweet', 'system'));

-- ユーザーカードテーブル
CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  purchased BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON timeline_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);

-- リアルタイムを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;

-- 初期データ（銘柄）
INSERT INTO stocks (symbol, name, price, coefficient, max_holdings, initial_price) VALUES
  ('A', 'インフラテック', 100, 0.2, 100, 100),
  ('B', 'ネクストラ', 100, 0.6, 100, 100)
ON CONFLICT (symbol) DO NOTHING;

