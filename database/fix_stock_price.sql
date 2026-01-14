-- 株価を修正するSQL
-- priceを直接編集した場合、initial_priceも同じ値に更新する必要があります
-- または、取引履歴から正しく計算し直す

-- 方法1: initial_priceを現在のpriceに合わせる（取引履歴をリセットする場合）
-- UPDATE stocks SET initial_price = price WHERE symbol = 'A';
-- UPDATE stocks SET initial_price = price WHERE symbol = 'B';

-- 方法2: 取引履歴から正しく計算し直す（推奨）
-- これはAPI側で自動的に行われるので、このSQLは不要です
-- ただし、priceを直接編集した場合は、initial_priceも同じ値に更新してください

-- 現在のpriceをinitial_priceに合わせて修正する場合（取引履歴を基準に再計算）
-- このSQLは実行しないでください。APIが自動的に計算します。

-- 注意: priceを直接編集する場合は、必ずinitial_priceも同じ値に更新してください
-- UPDATE stocks SET initial_price = price WHERE symbol = 'A';
-- UPDATE stocks SET initial_price = price WHERE symbol = 'B';

