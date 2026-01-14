// 完成版ルール（将来用）
// 現在はデモ版と同じ設定

import { GameRules } from './demoRules';
import { demoRules } from './demoRules';

export const productionRules: GameRules = {
  ...demoRules,
  // 完成版では以下を変更可能
  // playTime: 180, // 例：3時間
  // participantCount: 100,
};

