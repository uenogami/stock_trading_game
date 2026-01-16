-- 重複ユーザー名がある場合、最新のもの以外を削除
-- 注意: このSQLを実行する前に、check_users.sqlで確認してください

-- 重複ユーザー名のうち、最新以外を削除
DELETE FROM users
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
    FROM users
  ) t
  WHERE rn > 1
);

-- 削除されたユーザーのuser_cardsも削除（外部キー制約により自動削除されるはずですが、念のため）
-- DELETE FROM user_cards
-- WHERE user_id NOT IN (SELECT id FROM users);

