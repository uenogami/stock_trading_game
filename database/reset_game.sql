-- ゲームをリセットするSQL
-- 注意: このSQLを実行すると、取引履歴と株価が初期状態に戻ります

-- 1. 取引履歴を全て削除
DELETE FROM trades;

-- 2. タイムラインポストを全て削除（オプション：削除したくない場合はコメントアウト）
-- DELETE FROM timeline_posts;

-- 3. 株価を初期値にリセット
UPDATE stocks SET 
  price = initial_price,
  change24h = 0,
  volume = 0,
  updated_at = NOW()
WHERE symbol IN ('A', 'B');

-- 4. ユーザーの資産を初期値にリセット（オプション：削除したくない場合はコメントアウト）
-- UPDATE users SET 
--   cash = 5000,
--   holdings = '{"A": 25, "B": 25}'::jsonb,
--   insurance_used = false,
--   updated_at = NOW();

-- 5. ユーザーカードをリセット（オプション）
-- DELETE FROM user_cards;

