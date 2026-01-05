# Stock Market Game (Prototype) - UI

## 目的
招待制（10〜100人程度）のテストプレイ用に、架空株式売買ゲームのUIを実装する。
最初は「動くUIと画面遷移」「ダミーデータで成立する挙動」を優先し、サーバー連携は後回し。

**本アプリはWebアプリとして実装し、スマートフォンでの参加を想定しています。**

---

## 技術スタック（暫定）
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **チャート**: Recharts（軽くて実装が早い）
- **状態管理**: 初期は Zustand or React Context（後で差し替え可）
- **API**: まずはローカルのmock（`/app/api` or `fixtures`）でOK

---

## 画面要件（MVP）

### 1. Home（ダッシュボード） `/`
ユーザーの現在状況を1画面に集約し、各ボタンをタップすると該当ページへ遷移できる。

**詳細なレイアウト構造は [`concept/home-layout.md`](./concept/home-layout.md) を参照**

#### レイアウト構成（スマートフォン向け）
- **トップナビゲーション**：
  - 「特別ルール」ボタン → `/rules` へ遷移
  - 「残り時間」表示（例：残り6日18時間）→ `/season` へ遷移可能
  - 「プロフ」ボタン → `/profile` へ遷移
- **メインコンテンツ（中央）**：
  - 所有資産円グラフ（現金/銘柄A/銘柄B/銘柄X など）
  - 総資産（例：1010p）
  - 前日比（例：+10p）
- **ショートカットボタン**：
  - 保険（`/insurance`）へ遷移
  - 銘柄一覧（`/stocks`）へ遷移
  - 情報売買（`/intel`）へ遷移
- **ニュース/イベントフィード**：
  - 市場の動きやイベント情報を表示（例：「A銘柄 急騰中」「B社 新製品発表まであと2日2時間」「誰かがAを大量購入」「Bが急落」）
  - タイムライン（`/timeline`）の最新10件を埋め込み表示
  - タップで `/timeline` へ遷移可能

### 2. 銘柄一覧 `/stocks`
- 銘柄A / 銘柄B / （最終日以降なら銘柄X）カード一覧
- 各カードに：
  - 現在価格
  - 24h変化率
  - 出来高（任意）
  - 次のイベントまでの時間（任意）
- タップで銘柄詳細へ

### 3. 銘柄詳細 `/stocks/[symbol]`
- 価格チャート（1D/1Wの切替だけでOK）
- 現在価格、前日比、出来高
- 売買パネル（Buy / Sell）
  - 数量入力 or 金額入力（どちらかで統一）
  - 手数料は無し（または固定）※後で調整
- 「発表予定」「公式情報」欄（テキスト）
- 「市場の噂」欄（タイムラインの関連投稿を表示）

### 4. 情報売買 `/intel`
- リーク情報の購入UI
  - 価格（p）
  - 購入で「自分だけが見れる情報」を解放
- 既購入リスト（再閲覧可能）
- 注意書き：
  - 情報は真偽混在（ゲーム上の仕様）

### 5. 特別ルール `/rules`
- 今シーズンのルールを箇条書きで固定表示
- 重要な条件（最終日倍率、現金倍率、買付回数ボーナス、保険など）を強調
- **レイアウト**：
  - 左側：特別ルールの詳細リスト
  - 右側：プロフィール情報の概要（資産順位、取引履歴へのリンク）
  - トップ：ナビゲーションボタン（特別ルール、残り時間、プロフ）

### 6. シーズン情報 `/season`
- シーズン期間、銘柄一覧、イベント予定
- 重要イベントのカウントダウン
- "仕様としての説明"を集約（参加者が迷わないページ）

### 7. 保険 `/insurance`
- 発動条件（例：資産300p以下で利用可能）
- 「500p付与」ボタン（条件未達ならdisabled）
- 使用済みフラグの表示（バッジ）

### 8. タイムライン `/timeline`
- 投稿一覧（売買ログ、噂、宣言、煽り、分析など）
- 投稿作成（テキストのみでOK）
- 投稿種別タグ：
  - `rumor` / `analysis` / `claim` / `trade-log`（簡易でよい）

### 9. プロフィール `/profile`
- 自分の総資産推移（折れ線 or バー）
- 取引履歴一覧
- 現在の大まかな順位（例：上位30%）
- 保険使用済みの表示
- **レイアウト**：
  - 左側：特別ルールの概要（主要ルールへのリンク）
  - 右側：プロフィール情報の詳細
  - トップ：ナビゲーションボタン（特別ルール、残り時間、プロフ）

---

## ルール反映（UI上の表示だけ先にやる）
- 「残り時間」表示
- 「買付回数」表示（10回以上ボーナスのため）
- 「保険使用済み」バッジ
- 「最終日銘柄Xの解禁」：シーズン残り時間からUI出し分け

---

## データ（最初は mock でOK）

### User
```typescript
{
  id: string;
  name: string;
  cash: number;
  holdings: { [symbol: string]: number };
  totalAsset: number;
  delta24h: number;
  buyCount: number;
  insuranceUsed: boolean;
}
```

### Stock
```typescript
{
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  chartSeries: Array<{ time: string; price: number }>;
}
```

### Season
```typescript
{
  startAt: string;
  endAt: string;
  events: Array<{ date: string; description: string }>;
  rules: string[];
}
```

### TimelinePost
```typescript
{
  id: string;
  userId: string;
  type: 'rumor' | 'analysis' | 'claim' | 'trade-log';
  text: string;
  createdAt: string;
}
```

### IntelItem
```typescript
{
  id: string;
  title: string;
  price: number;
  content: string;
  isPurchased: boolean;
}
```

---

## UI/UX方針
- **ページ遷移型の構造**：セクション分割ではなく、各機能を独立したページとして実装
- **スマートフォン最優先**：幅360〜430pxを基準としたモバイルファーストデザイン
- **1画面完結のダッシュボード**：Homeページで主要情報を一覧表示
- **クリック数を減らす**：売買は銘柄詳細で完結、主要ページへの遷移を容易に
- **タイムラインはゲームの主役**：心理戦の舞台として機能
- **ナビゲーションの明確化**：各ページから主要ページへ容易に遷移可能

---

## 実装優先順位

1. **ルーティングと画面骨組み**（上記9ページ）
2. **Homeの円グラフ + タイムライン埋め込み**
3. **銘柄一覧 → 銘柄詳細 → 売買UI**（mockで状態更新）
4. **ルール/シーズン/プロフィール/保険**
5. **情報売買**（購入状態の管理）

---

## 完了条件（MVP）
- Homeから全ページへ遷移できる
- 銘柄詳細でBuy/Sellすると総資産/保有が即時に変化する（mockで可）
- タイムライン投稿が追加できる（ローカル状態で可）
- 保険が条件で押せる/押せないがUIに反映される

---

## 開発環境セットアップ

```bash
# Next.jsプロジェクトの作成
npx create-next-app@latest . --typescript --tailwind --app

# 依存関係のインストール
npm install recharts zustand

# 開発サーバーの起動
npm run dev
```

---

## ディレクトリ構造（予定）

```
stock trading/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx              # Home (/)
│   │   ├── stocks/
│   │   │   ├── page.tsx          # 銘柄一覧
│   │   │   └── [symbol]/
│   │   │       └── page.tsx      # 銘柄詳細
│   │   ├── intel/
│   │   │   └── page.tsx          # 情報売買
│   │   ├── rules/
│   │   │   └── page.tsx          # 特別ルール
│   │   ├── season/
│   │   │   └── page.tsx          # シーズン情報
│   │   ├── insurance/
│   │   │   └── page.tsx          # 保険
│   │   ├── timeline/
│   │   │   └── page.tsx          # タイムライン
│   │   └── profile/
│   │       └── page.tsx          # プロフィール
│   ├── api/                       # API routes (mock)
│   └── layout.tsx
├── components/                    # 共通コンポーネント
├── lib/                           # ユーティリティ
├── store/                         # Zustand stores
├── fixtures/                      # Mock data
└── README.md
```

---

## 注意事項
- サーバー連携は後回し（まずはローカル状態で完結）
- 認証機能は後で追加（最初は固定ユーザーでOK）
- リアルタイム更新は後で検討（最初は手動リロードでOK）

