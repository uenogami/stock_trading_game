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
  chartSeries: Array<{ time: string; price: number }>;
}

export interface TimelinePost {
  id: string;
  userId: string;
  userName: string;
  type: 'rumor' | 'analysis' | 'claim' | 'trade-log';
  text: string;
  createdAt: string;
}

export const mockUser: User = {
  id: "user1",
  name: "テストユーザー",
  cash: 500,
  holdings: {
    A: 10,
    B: 5,
  },
  totalAsset: 1010,
  delta24h: 10,
  buyCount: 3,
  insuranceUsed: false,
};

export const mockStocks: Stock[] = [
  {
    symbol: "A",
    name: "銘柄A",
    price: 50,
    change24h: 5,
    volume: 1000,
    chartSeries: [],
  },
  {
    symbol: "B",
    name: "銘柄B",
    price: 30,
    change24h: -2,
    volume: 800,
    chartSeries: [],
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

