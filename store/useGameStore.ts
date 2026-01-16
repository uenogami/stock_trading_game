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
  gameStartTime: Date | null;
  elapsedMinutes: number;
  elapsedSeconds: number;
  setGameStartTime: (time: Date | null) => void;
  updateElapsedTime: (minutes: number, seconds: number) => void;
  // 購入アクション
  buyStock: (symbol: string, quantity: number) => void;
  // 売却アクション
  sellStock: (symbol: string, quantity: number) => void;
  // 総資産を計算
  calculateTotalAsset: () => number;
  // クールダウン残り時間を取得（秒）
  getCooldownRemaining: () => number;
  // 保険を発動
  activateInsurance: () => void;
  // カードを購入
  buyCard: (cardId: string) => void;
  // カードを発動
  activateCard: (cardId: string) => void;
  // タイムラインに投稿を追加
  addTimelinePost: (post: Omit<TimelinePost, 'id' | 'createdAt'>) => void;
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
  // ゲーム進行時間管理（UTC基準）
  gameStartTime: null,
  elapsedMinutes: 0,
  elapsedSeconds: 0,
  setGameStartTime: (time: Date | null) => set({ gameStartTime: time }),
  updateElapsedTime: (minutes: number, seconds: number) => set({ elapsedMinutes: minutes, elapsedSeconds: seconds }),
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
      // 4つのAPIリクエストを並列実行して高速化
      const [userRes, stocksRes, timelineRes, cardsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch('/api/stocks'),
        fetch('/api/timeline?limit=100'),
        fetch(`/api/cards?userId=${userId}`),
      ]);

      // エラーチェック
      if (!userRes.ok) {
        throw new Error('Failed to load user data');
      }
      if (!stocksRes.ok) {
        throw new Error('Failed to load stocks data');
      }
      if (!timelineRes.ok) {
        throw new Error('Failed to load timeline data');
      }
      if (!cardsRes.ok) {
        throw new Error('Failed to load cards data');
      }

      // JSONを並列でパース
      const [userData, stocksData, timelineData, cardsData] = await Promise.all([
        userRes.json(),
        stocksRes.json(),
        timelineRes.json(),
        cardsRes.json(),
      ]);
      
      // 取引履歴がない場合（リセット後）、ゲーム開始時刻をリセット
      const hasTrades = stocksData.stocks?.some((s: Stock) => s.volume > 0) || timelineData.posts?.length > 0;
      if (!hasTrades) {
        // ゲーム開始時刻を現在時刻にリセット
        localStorage.setItem('gameStartTime', new Date().toISOString());
      }
      
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
        // カード情報をマージ（購入済み・アクティブ状態を反映）
        cards: initializeCards().map((card) => {
          const userCard = (cardsData.cards || []).find((uc: any) => uc.card_id === card.id);
          if (userCard) {
            const expiresAt = userCard.expires_at ? new Date(userCard.expires_at).getTime() : undefined;
            // 有効期限切れのカードは無効化
            const isExpired = expiresAt && Date.now() >= expiresAt;
            return {
              ...card,
              purchased: userCard.purchased || false,
              active: (userCard.active || false) && !isExpired,
              expiresAt,
            };
          }
          return card;
        }),
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
  cooldownMinutes: gameRules.trading.cooldownMinutes, // ゲームルールから取得（10秒 = 10/60分）
  tradeHistory: [],

  // 総資産を計算（負債反転カードの効果を考慮）
  calculateTotalAsset: () => {
    const { user, stocks, cards } = get();
    const stockPrices: { [symbol: string]: number } = {};
    stocks.forEach((stock) => {
      stockPrices[stock.symbol] = stock.price;
    });

    // holdingsが存在しない場合は0として扱う
    const holdings = user.holdings || {};
    const holdingsValue = Object.entries(holdings).reduce(
      (sum, [symbol, quantity]) => {
        return sum + quantity * (stockPrices[symbol] || 0);
      },
      0
    );

    // cashがundefinedの場合は0として扱う
    const cash = user.cash ?? 0;
    return cash + holdingsValue;
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

  // リアルタイム同期用：株価を更新
  updateStockFromRealtime: (updatedStock: Stock) => {
    const { stocks } = get();
    const existingStock = stocks.find((s) => s.symbol === updatedStock.symbol);
    
    // 新しいチャートデータが提供されている場合はそれを使用、なければ既存のものを保持
    const updatedStocks = stocks.map((s) =>
      s.symbol === updatedStock.symbol
        ? {
            ...updatedStock,
            chartSeries: updatedStock.chartSeries?.length > 0 
              ? updatedStock.chartSeries 
              : (existingStock?.chartSeries || []),
            description: updatedStock.description || existingStock?.description || "",
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
  buyCard: async (cardId: string) => {
    const { user, cards } = get();
    const userId = getLocalUserId();
    if (!userId) {
      alert('ログインが必要です');
      return;
    }

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

    // API経由でカードを購入
    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cardId, action: 'buy' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'カードの購入に失敗しました';
      alert(errorMessage);
      return;
    }

    const result = await response.json();

    // 順位差表示カードの場合は、その時点の情報をlocalStorageに保存
    if (cardId === 'rank-difference') {
      try {
        const rankingsRes = await fetch(`/api/rankings?userId=${userId}`);
        if (rankingsRes.ok) {
          const rankingsData = await rankingsRes.json();
          const eventData = {
            userRank: rankingsData.userRank,
            totalUsers: rankingsData.totalUsers,
            upperRank: rankingsData.upperRank || null,
            lowerRank: rankingsData.lowerRank || null,
            allRankings: null,
          };
          
          // localStorageに保存
          const cardDataKey = `rankDifferenceCardData_${userId}`;
          const cardData = {
            usedAt: { minutes: 0, seconds: 0 }, // 後で再計算される
            usedAtTimestamp: new Date().toISOString(),
            rankData: eventData,
          };
          localStorage.setItem(cardDataKey, JSON.stringify(cardData));
        }
      } catch (error) {
        console.error('Failed to save rank difference card data:', error);
      }
    }

    // ストアを更新（購入時はactive: false）
    const updatedCards = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          purchased: true,
          active: false, // 購入時は未発動
        };
      }
      return c;
    });

    set({
      user: {
        ...user,
        cash: user.cash - card.price,
      },
      cards: updatedCards,
    });

    // ユーザー情報を再読み込み
    await get().loadInitialData(userId);
  },

  // カードを発動
  activateCard: async (cardId: string) => {
    const { cards } = get();
    const userId = getLocalUserId();
    if (!userId) {
      alert('ログインが必要です');
      return;
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      alert('カードが見つかりません');
      return;
    }

    if (!card.purchased) {
      alert('このカードは購入されていません');
      return;
    }

    if (card.active) {
      alert('既に発動中です');
      return;
    }

    // API経由でカードを発動
    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cardId, action: 'activate' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'カードの発動に失敗しました';
      alert(errorMessage);
      return;
    }

    const result = await response.json();

    // ストアを更新
    set({
      cards: cards.map((c) =>
        c.id === cardId ? { ...c, active: true, expiresAt: result.expiresAt ? new Date(result.expiresAt).getTime() : undefined } : c
      ),
    });

    // 初期データを再ロード（カード状態を最新化）
    await get().loadInitialData(userId);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || '取引に失敗しました'
        const errorDetails = errorData.details ? `: ${errorData.details}` : ''
        console.error('Trade error:', errorMessage, errorDetails)
        alert(`${errorMessage}${errorDetails}`)
        return
      }

      // 成功したらクールダウンを更新
      set({ lastTradeTime: Date.now() });
      
      // ユーザー情報と株価を即座に更新（リアルタイム更新を待たない）
      await get().loadInitialData(userId);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || '取引に失敗しました'
        const errorDetails = errorData.details ? `: ${errorData.details}` : ''
        console.error('Trade error:', errorMessage, errorDetails)
        alert(`${errorMessage}${errorDetails}`)
        return
      }

      const data = await response.json();

      // 成功したらクールダウンを更新
      set({ lastTradeTime: Date.now() });
      
      // ユーザー情報と株価を即座に更新（リアルタイム更新を待たない）
      await get().loadInitialData(userId);
    } catch (error) {
      console.error('Sell stock error:', error);
      alert('取引に失敗しました');
    }
  },

  // 保険を発動（API経由）
  activateInsurance: async () => {
    const userId = getLocalUserId();
    if (!userId) {
      alert('ログインが必要です');
      return;
    }

    const { user } = get();
    const totalAsset = get().calculateTotalAsset();

    // 保険発動条件チェック（総資産が1000p以下）
    if (totalAsset > gameRules.insurance.threshold) {
      alert(`保険は総資産が${gameRules.insurance.threshold}p以下の場合のみ発動可能です`);
      return;
    }

    // 既に使用済みかチェック
    if (user.insuranceUsed) {
      alert('保険は1回のみ使用可能です');
      return;
    }

    try {
      const response = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '保険発動に失敗しました');
        return;
      }

      // 成功したらユーザー情報を更新
      await get().loadInitialData(userId);
      alert(`保険を発動しました！${gameRules.insurance.amount}pが付与されました。`);
    } catch (error) {
      console.error('Activate insurance error:', error);
      alert('保険発動に失敗しました');
    }
  },
}));

