# リアルタイムマルチプレイ設定ガイド

このアプリを異なる場所でリアルタイムにマルチプレイできるようにするためのセットアップ手順です。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの「Settings」→「API」から以下を取得：
   - Project URL
   - `anon` `public` key

## 2. データベーススキーマの適用

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `database/schema.sql`の内容をコピー＆ペースト
3. 「Run」をクリックして実行

## 3. 環境変数の設定

1. `.env.local`ファイルを作成（`.env.local.example`を参考）
2. 以下の値を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. パッケージのインストール

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## 5. 認証の設定（オプション）

Supabaseダッシュボードの「Authentication」→「Providers」で認証方法を設定：
- Email認証を有効化
- 必要に応じて他の認証方法も有効化

## 6. リアルタイムの有効化

Supabaseダッシュボードの「Database」→「Replication」で以下を有効化：
- `stocks`テーブル
- `timeline_posts`テーブル
- `trades`テーブル

（`schema.sql`で既に設定済みの場合は不要）

## 7. デプロイ

### Vercelでのデプロイ（推奨）

1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定（`.env.local`の内容）
4. デプロイ

### その他のホスティング

- Railway
- Render
- Fly.io

いずれも環境変数を設定する必要があります。

## 8. 使用方法

1. 各プレイヤーがアプリにアクセス
2. サインアップ/ログイン
3. 同じゲームセッションでプレイ

## 注意事項

- リアルタイム同期は自動的に動作します
- 株価の変更は全プレイヤーに即座に反映されます
- タイムラインの投稿もリアルタイムで共有されます
- 取引はサーバー側で検証され、不正な取引は拒否されます

## トラブルシューティング

### リアルタイムが動作しない場合

1. SupabaseダッシュボードでReplicationが有効になっているか確認
2. ブラウザのコンソールでエラーを確認
3. ネットワーク接続を確認

### 認証エラーが発生する場合

1. 環境変数が正しく設定されているか確認
2. Supabaseの認証設定を確認
3. ブラウザのCookieをクリア

