-- ゲームを完全にリセットするSQL
-- 取引履歴、タイムライン、ユーザー資産を全て初期状態に戻します
-- 注意: ユーザーアカウント（ログイン情報）は保持されます

-- 1. 取引履歴を全て削除
DELETE FROM trades;

-- 2. タイムラインポストを全て削除
DELETE FROM timeline_posts;

-- 3. 株価を初期値にリセット
UPDATE stocks SET 
  price = initial_price,
  change24h = 0,
  volume = 0,
  updated_at = NOW()
WHERE symbol IN ('A', 'B');

-- 4. ユーザーの資産を初期値にリセット
-- 初期現金: 5000p
-- 初期保有: A銘柄25株、B銘柄25株
UPDATE users SET 
  cash = 5000,
  holdings = '{"A": 25, "B": 25}'::jsonb,
  insurance_used = false,
  updated_at = NOW();

-- 5. ユーザーカードをリセット
DELETE FROM user_cards;

-- 注意: ユーザーアカウント（usersテーブルのid, name, password_hash）は保持されます
-- ログイン情報は削除されません

