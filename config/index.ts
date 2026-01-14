// 設定のエクスポート
// デモ版と完成版を切り替え可能

import { demoRules } from './demoRules';
import { productionRules } from './productionRules';

// 現在のモード（環境変数や設定で切り替え可能）
const GAME_MODE = process.env.NEXT_PUBLIC_GAME_MODE || 'demo';

export const gameRules = GAME_MODE === 'production' ? productionRules : demoRules;

// 型定義もエクスポート
export type { GameRules } from './demoRules';

