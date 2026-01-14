-- 株価のみをリセットするSQL（取引履歴とユーザー資産は保持）

-- 1. 取引履歴を全て削除
DELETE FROM trades;

-- 2. 株価を初期値にリセット
UPDATE stocks SET 
  price = initial_price,
  change24h = 0,
  volume = 0,
  updated_at = NOW()
WHERE symbol IN ('A', 'B');

-- 注意: ユーザーの保有株や現金は変更されません
-- タイムラインポストも保持されます

