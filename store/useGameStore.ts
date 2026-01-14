import { create } from 'zustand';
import { User, Stock, TimelinePost } from '@/fixtures/mockData';
import { mockUser, mockStocks } from '@/fixtures/mockData';
import { gameRules } from '@/config';
import { getLocalUserId } from '@/lib/localAuth';

interface Card {
  id: string;
  name: string;
  price: number;
  purchased: boolean;
  active?: boolean; // カードがアクティブかどうか
  expiresAt?: number; // 有効期限（ミリ秒）
}

interface GameState {
  // ユーザー状態
  user: User;
  // 簡易ログイン：ユーザー名/IDを設定
  setUserIdentity: (id: string, name: string) => void;
  // 初期データをロード
  loadInitialData: (userId: string) => Promise<void>;
  // ローディング状態
  isLoading: boolean;
  // 株価データ
  stocks: Stock[];
  // タイムラインポスト
  timelinePosts: TimelinePost[];
  // カードシステム
  cards: Card[];
  // クールダウン管理
  lastTradeTime: number | null; // 最後の取引時刻（ミリ秒）
  cooldownMinutes: number; // クールダウン時間（分）
  // 取引履歴（株価変動計算用）
  tradeHistory: Array<{
    symbol: string;
    type: 'buy' | 'sell';
    quantity: number;
    timestamp: number;
  }>;
  // 購入アクション
  buyStock: (symbol: string, quantity: number) => void;
  // 売却アクション
  sellStock: (symbol: string, quantity: number) => void;
  // 総資産を計算
  calculateTotalAsset: () => number;
  // 前日比を計算（簡易版：現在は固定値）
  calculateDelta24h: () => number;
  // クールダウン残り時間を取得（秒）
  getCooldownRemaining: () => number;
  // 保険を発動
  activateInsurance: () => void;
  // カードを購入
  buyCard: (cardId: string) => void;
  // カードを使用
  useCard: (cardId: string) => void;
  // タイムラインに投稿を追加
  addTimelinePost: (post: Omit<TimelinePost, 'id' | 'createdAt'>) => void;
  // 株価を更新（取引履歴から計算）
  updateStockPrice: (symbol: string) => void;
  // リアルタイム同期用：株価を更新
  updateStockFromRealtime: (stock: Stock) => void;
  // リアルタイム同期用：タイムラインポストを追加
  addTimelinePostFromRealtime: (post: TimelinePost) => void;
}

// カードの初期化
const initializeCards = (): Card[] => {
  return gameRules.cards.map((card) => ({
    id: card.id,
    name: card.name,
    price: card.price,
    purchased: false,
    active: false,
  }));
};

export const useGameStore = create<GameState>((set, get) => ({
  // 初期状態
  user: { ...mockUser },
  isLoading: false,
  setUserIdentity: (id: string, name: string) => {
    const trimmedName = name.trim();
    const trimmedId = id.trim();
    if (!trimmedName || !trimmedId) return;
    set((state) => ({
      user: {
        ...state.user,
        id: trimmedId,
        name: trimmedName,
      },
    }));
  },
  loadInitialData: async (userId: string) => {
    set({ isLoading: true });
    try {
      // ユーザー情報を取得
      const userRes = await fetch(`/api/users/${userId}`);
      if (!userRes.ok) {
        throw new Error('Failed to load user data');
      }
      const userData = await userRes.json();

      // 株価情報を取得
      const stocksRes = await fetch('/api/stocks');
      if (!stocksRes.ok) {
        throw new Error('Failed to load stocks data');
      }
      const stocksData = await stocksRes.json();

      // タイムラインポストを取得
      const timelineRes = await fetch('/api/timeline?limit=100');
      if (!timelineRes.ok) {
        throw new Error('Failed to load timeline data');
      }
      const timelineData = await timelineRes.json();

      // ストアを更新
      set({
        user: {
          ...userData.user,
          // 総資産を再計算（株価を含む）
          totalAsset: userData.user.cash + Object.entries(userData.user.holdings || {}).reduce(
            (sum, [symbol, qty]: [string, any]) => {
              const stock = stocksData.stocks.find((s: Stock) => s.symbol === symbol);
              return sum + (qty || 0) * (stock?.price || 0);
            },
            0
          ),
        },
        stocks: stocksData.stocks || [...mockStocks],
        timelinePosts: (timelineData.posts || []).map((post: any) => ({
          id: post.id,
          userId: post.user_id,
          userName: post.user_name,
          type: post.type,
          text: post.text,
          createdAt: post.created_at,
        })),
        lastTradeTime: userData.lastTradeTime,
        isLoading: false,
      });
    } catch (error) {
      console.error('Load initial data error:', error);
      set({ isLoading: false });
      // エラー時はモックデータを使用
      set({
        user: { ...mockUser },
        stocks: [...mockStocks],
        timelinePosts: [],
      });
    }
  },
  stocks: [...mockStocks],
  timelinePosts: [],
  cards: initializeCards(),
  lastTradeTime: null,
  cooldownMinutes: 1, // デモ版：1分間のクールダウン
  tradeHistory: [],

  // 総資産を計算
  calculateTotalAsset: () => {
    const { user, stocks } = get();
    const stockPrices: { [symbol: string]: number } = {};
    stocks.forEach((stock) => {
      stockPrices[stock.symbol] = stock.price;
    });

    const holdingsValue = Object.entries(user.holdings).reduce(
      (sum, [symbol, quantity]) => {
        return sum + quantity * (stockPrices[symbol] || 0);
      },
      0
    );

    return user.cash + holdingsValue;
  },

  // 前日比を計算（簡易版）
  calculateDelta24h: () => {
    // 実際の実装では、前日の総資産と比較する必要があります
    // ここでは簡易的に固定値を使用
    return get().user.delta24h;
  },

  // クールダウン残り時間を取得（秒）
  getCooldownRemaining: () => {
    const { lastTradeTime, cooldownMinutes } = get();
    if (!lastTradeTime) return 0;
    
    const elapsed = (Date.now() - lastTradeTime) / 1000; // 秒
    const cooldownSeconds = cooldownMinutes * 60;
    const remaining = cooldownSeconds - elapsed;
    return Math.max(0, Math.ceil(remaining));
  },

  // 株価を更新（取引履歴から計算）
  updateStockPrice: (symbol: string) => {
    const { stocks, tradeHistory } = get();
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) return;

    // 該当銘柄の全取引を集計
    const symbolTrades = tradeHistory.filter((t) => t.symbol === symbol);
    const buyCount = symbolTrades.filter((t) => t.type === 'buy').reduce((sum, t) => sum + t.quantity, 0);
    const sellCount = symbolTrades.filter((t) => t.type === 'sell').reduce((sum, t) => sum + t.quantity, 0);
    
    // 初期価格を取得（設定から）
    const initialPrice = 100; // デモ版の初期価格
    
    // 価格変動 = (買い注文数 - 売り注文数) × 係数
    // 初期価格から累積変動を計算
    const priceChange = (buyCount - sellCount) * stock.coefficient;
    const newPrice = Math.max(1, initialPrice + priceChange); // 最低1p

    // チャートデータに追加
    const newChartData = [
      ...stock.chartSeries,
      {
        time: new Date().toISOString().split('T')[0],
        price: Math.round(newPrice * 10) / 10,
      },
    ].slice(-30); // 最新30件のみ保持

    const updatedStocks = stocks.map((s) =>
      s.symbol === symbol
        ? {
            ...s,
            price: Math.round(newPrice * 10) / 10,
            chartSeries: newChartData,
          }
        : s
    );

    set({ stocks: updatedStocks });
  },

  // リアルタイム同期用：株価を更新
  updateStockFromRealtime: (updatedStock: Stock) => {
    const { stocks } = get();
    const existingStock = stocks.find((s) => s.symbol === updatedStock.symbol);
    
    // 既存のチャートデータと説明文を保持
    const updatedStocks = stocks.map((s) =>
      s.symbol === updatedStock.symbol
        ? {
            ...updatedStock,
            chartSeries: existingStock?.chartSeries || updatedStock.chartSeries,
            description: existingStock?.description || updatedStock.description,
          }
        : s
    );

    set({ stocks: updatedStocks });
  },

  // リアルタイム同期用：タイムラインポストを追加
  addTimelinePostFromRealtime: (post: TimelinePost) => {
    const { timelinePosts } = get();
    // 既に存在する場合は追加しない（重複防止）
    if (timelinePosts.some((p) => p.id === post.id)) {
      return;
    }
    set({
      timelinePosts: [post, ...timelinePosts].slice(0, 100), // 最新100件のみ保持
    });
  },

  // タイムラインに投稿を追加（API経由）
  addTimelinePost: async (post: Omit<TimelinePost, 'id' | 'createdAt'>) => {
    const userId = getLocalUserId();
    if (!userId) {
      alert('ログインが必要です');
      return;
    }

    try {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: post.type,
          text: post.text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '投稿に失敗しました');
        return;
      }

      // 成功したらストアに追加（APIから返ってきたデータを使う）
      if (data.post) {
        const newPost: TimelinePost = {
          id: data.post.id,
          userId: data.post.user_id,
          userName: data.post.user_name,
          type: data.post.type,
          text: data.post.text,
          createdAt: data.post.created_at,
        };
        const { timelinePosts } = get();
        set({
          timelinePosts: [newPost, ...timelinePosts].slice(0, 100),
        });
      }
    } catch (error) {
      console.error('Add timeline post error:', error);
      alert('投稿に失敗しました');
    }
  },

  // カードを購入
  buyCard: (cardId: string) => {
    const { user, cards } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      alert('カードが見つかりません');
      return;
    }

    if (card.purchased) {
      alert('このカードは既に購入済みです');
      return;
    }

    if (user.cash < card.price) {
      alert('現金が不足しています');
      return;
    }

    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, purchased: true } : c
    );

    set({
      user: {
        ...user,
        cash: user.cash - card.price,
      },
      cards: updatedCards,
    });
  },

  // カードを使用
  useCard: (cardId: string) => {
    const { cards } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card || !card.purchased) {
      alert('カードが購入されていません');
      return;
    }

    const updatedCards = cards.map((c) => {
      if (c.id === cardId) {
        if (cardId === 'debt-reversal') {
          // 負債反転カード：5分間有効
          return {
            ...c,
            active: true,
            expiresAt: Date.now() + 5 * 60 * 1000,
          };
        } else {
          // その他のカード：1回使用で無効化
          return { ...c, active: true };
        }
      }
      return c;
    });

    set({ cards: updatedCards });
  },

  // 銘柄を購入（API経由）
  buyStock: async (symbol: string, quantity: number) => {
    const userId = getLocalUserId();
    if (!userId) {
      alert('ログインが必要です');
      return;
    }

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symbol,
          type: 'buy',
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '取引に失敗しました');
        return;
      }

      // 成功したらストアを更新（APIから返ってきたデータを使う）
      // 実際のデータはリアルタイム同期で更新されるので、ここではクールダウンだけ更新
      set({ lastTradeTime: Date.now() });
    } catch (error) {
      console.error('Buy stock error:', error);
      alert('取引に失敗しました');
    }
  },

  // 銘柄を売却（API経由）
  sellStock: async (symbol: string, quantity: number) => {
    const userId = getLocalUserId();
    if (!userId) {
      alert('ログインが必要です');
      return;
    }

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symbol,
          type: 'sell',
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '取引に失敗しました');
        return;
      }

      // 成功したらストアを更新（APIから返ってきたデータを使う）
      // 実際のデータはリアルタイム同期で更新されるので、ここではクールダウンだけ更新
      set({ lastTradeTime: Date.now() });
    } catch (error) {
      console.error('Sell stock error:', error);
      alert('取引に失敗しました');
    }
  },

  // 保険を発動
  activateInsurance: () => {
    const { user } = get();
    const totalAsset = get().calculateTotalAsset();

    // 保険発動条件チェック（総資産が1000p以下）
    if (totalAsset > 1000) {
      alert('保険は総資産が1000p以下の場合のみ発動可能です');
      return;
    }

    // 既に使用済みかチェック
    if (user.insuranceUsed) {
      alert('保険は1回のみ使用可能です');
      return;
    }

    // 保険発動（2000p付与）
    const newCash = user.cash + 2000;
    const newTotalAsset = get().calculateTotalAsset() + 2000;

    set({
      user: {
        ...user,
        cash: newCash,
        insuranceUsed: true,
        totalAsset: newTotalAsset,
      },
    });
  },
}));

