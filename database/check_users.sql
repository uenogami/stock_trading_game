-- ユーザー一覧を確認
SELECT id, name, cash, created_at 
FROM users 
ORDER BY created_at;

-- 重複ユーザー名を確認
SELECT name, COUNT(*) as count
FROM users
GROUP BY name
HAVING COUNT(*) > 1;

-- user_cardsテーブルとusersテーブルの関連を確認
SELECT uc.user_id, u.name, uc.card_id, uc.purchased, uc.active
FROM user_cards uc
LEFT JOIN users u ON uc.user_id = u.id
ORDER BY uc.user_id;

