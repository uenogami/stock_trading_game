// デモプレイ版・最終ルール（90分）

export interface GameRules {
  // 基本設定
  playTime: number; // 分
  participantCount: number;
  
  // 初期資産
  initialCash: number;
  initialHoldings: { [symbol: string]: number };
  
  // 銘柄設定
  stocks: Array<{
    symbol: string;
    name: string;
    initialPrice: number;
    coefficient: number; // 価格変動係数
    maxHoldings: number; // 最大保有数
    description: string;
    flavor: {
      type: string;
      industry: string;
      characteristics: string[];
    };
  }>;
  
  // 売買ルール
  trading: {
    cooldownMinutes: number;
    hasFee: boolean;
  };
  
  // 保険ルール
  insurance: {
    threshold: number; // 発動条件（総資産がこの値以下）
    amount: number; // 付与額
    oneTimeOnly: boolean;
  };
  
  // カードシステム
  cards: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>;
  
  // リアルタイムイベント
  events: Array<{
    time: number; // 経過時間（分）
    description: string;
    effects: string[];
  }>;
}

export const demoRules: GameRules = {
  playTime: 90,
  participantCount: 10,
  
  // 初期資産
  initialCash: 5000,
  initialHoldings: {
    A: 25, // 2,500p相当（100p × 25株）
    B: 25, // 2,500p相当（100p × 25株）
  },
  
  // 銘柄設定
  stocks: [
    {
      symbol: "A",
      name: "インフラテック",
      initialPrice: 100,
      coefficient: 0.2, // 堅実・守り
      maxHoldings: 40,
      description: "インフラテックは長年にわたり安定した事業を展開してきた企業です。新情報が出ても、市場は慎重に反応します。",
      flavor: {
        type: "老舗企業",
        industry: "インフラ系",
        characteristics: ["BtoB中心", "規制産業", "既存顧客が多い"],
      },
    },
    {
      symbol: "B",
      name: "ネクストラ",
      initialPrice: 100,
      coefficient: 0.6, // 挑戦的・荒れやすい
      maxHoldings: 30,
      description: "ネクストラは挑戦的な戦略を取る企業です。市場の期待と失望が、株価に大きく反映されます。",
      flavor: {
        type: "スタートアップ",
        industry: "エンタメ・テック系",
        characteristics: ["未上場子会社あり", "CEOが話題性の塊"],
      },
    },
  ],
  
  // 売買ルール
  trading: {
    cooldownMinutes: 1,
    hasFee: false,
  },
  
  // 保険ルール
  insurance: {
    threshold: 1000, // 総資産が1000p以下
    amount: 2000, // 2000p付与
    oneTimeOnly: true,
  },
  
  // カードシステム（闇トレーダー）
  cards: [
    {
      id: "anonymous-trade",
      name: "匿名売買ログカード",
      price: 1500,
      description: "次の1回の売買ログが「匿名ユーザー」表記になる",
    },
    {
      id: "fake-info",
      name: "偽情報投稿カード",
      price: 1500,
      description: "売買ログ風の偽情報を1回投稿可能（「未確認情報」タグ付き）",
    },
    {
      id: "rank-visibility",
      name: "順位常時可視化カード",
      price: 2000,
      description: "自分の順位をリアルタイムで確認可能（通常は20分ごとにしか順位確認不可）",
    },
    {
      id: "debt-reversal",
      name: "負債反転カード",
      price: 2000,
      description: "発動後5分間、確定損益のみ反転（マイナス→プラス、プラス→マイナス）",
    },
  ],
  
  // リアルタイムイベント
  events: [
    {
      time: 20,
      description: "自分の順位確認",
      effects: ["順位確認可能"],
    },
    {
      time: 40,
      description: "自分の順位確認 + 保有現金1.2倍イベント",
      effects: ["順位確認可能", "現金1.2倍"],
    },
    {
      time: 60,
      description: "下位プレイヤーがリークを持っている（信憑性のみ付与）",
      effects: ["情報共有"],
    },
    {
      time: 80,
      description: "ラストスパート告知",
      effects: ["告知"],
    },
    {
      time: 90,
      description: "ゲーム終了",
      effects: ["終了"],
    },
  ],
};

