-- パスワードカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 既存ユーザーにはNULLを許可（後で設定可能）

