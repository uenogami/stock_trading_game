// Mock data for development

export interface User {
  id: string;
  name: string;
  cash: number;
  holdings: { [symbol: string]: number };
  totalAsset: number;
  delta24h: number;
  buyCount: number;
  insuranceUsed: boolean;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  chartSeries: Array<{ time: string; price: number; minute: number }>;
  coefficient: number; // 価格変動係数
  maxHoldings: number; // 最大保有数
  description: string; // 説明文
}

export interface TimelinePost {
  id: string;
  userId: string;
  userName: string;
  type: 'rumor' | 'analysis' | 'claim' | 'trade-log' | 'tweet' | 'system';
  text: string;
  createdAt: string;
}

// デモ版ルールに基づく初期ユーザー
export const mockUser: User = {
  id: "user1",
  name: "テストユーザー",
  cash: 5000, // 初期現金：5,000p
  holdings: {
    A: 25, // 初期保有：25株（2,500p相当）
    B: 25, // 初期保有：25株（2,500p相当）
  },
  totalAsset: 10000, // 総資産：10,000p
  delta24h: 0,
  buyCount: 0,
  insuranceUsed: false,
};

// サンプルのチャートデータを生成する関数
const generateChartData = (basePrice: number, days: number = 7) => {
  const data = [];
  let currentPrice = basePrice * 0.9; // 開始価格を少し低く
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // ランダムな変動を追加
    currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1);
    data.push({
      time: date.toISOString().split('T')[0],
      price: Math.round(currentPrice * 10) / 10,
    });
  }
  // 最後の価格を現在価格に合わせる
  data[data.length - 1].price = basePrice;
  return data;
};

export const mockStocks: Stock[] = [
  {
    symbol: "A",
    name: "インフラテック",
    price: 100, // 初期価格：100p
    change24h: 0,
    volume: 0,
    coefficient: 0.2, // 堅実・守り
    maxHoldings: 40, // 最大保有数：40株
    description: "インフラテックは長年にわたり安定した事業を展開してきた企業です。新情報が出ても、市場は慎重に反応します。",
    chartSeries: generateChartData(100, 7),
  },
  {
    symbol: "B",
    name: "ネクストラ",
    price: 100, // 初期価格：100p
    change24h: 0,
    volume: 0,
    coefficient: 0.6, // 挑戦的・荒れやすい
    maxHoldings: 30, // 最大保有数：30株
    description: "ネクストラは挑戦的な戦略を取る企業です。市場の期待と失望が、株価に大きく反映されます。",
    chartSeries: generateChartData(100, 7),
  },
];

export const mockTimelinePosts: TimelinePost[] = [
  {
    id: "1",
    userId: "user2",
    userName: "ユーザー2",
    type: "rumor",
    text: "A銘柄 急騰中",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "user3",
    userName: "ユーザー3",
    type: "trade-log",
    text: "B社 新製品発表まであと2日2時間",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    userId: "user4",
    userName: "ユーザー4",
    type: "rumor",
    text: "誰かがAを大量購入",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    userId: "user5",
    userName: "ユーザー5",
    type: "analysis",
    text: "Bが急落",
    createdAt: new Date().toISOString(),
  },
];

