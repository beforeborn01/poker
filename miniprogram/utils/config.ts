// 配置服务（本地存储）
export type DealMode = 'round' | 'simultaneous';

export interface DealConfig {
  deckCount: 1 | 2;
  includeJokers: boolean;
  playerCount: number;
  dealMode: DealMode;
  perTime: number;
  reshuffle: boolean;
}

const STORAGE_KEY = 'deal-config:v1';
const TIP_KEY = 'deal-config:tip:skip';

const DEFAULT_CONFIG: DealConfig = {
  deckCount: 1,
  includeJokers: true,
  playerCount: 4,
  dealMode: 'round',
  perTime: 1,
  reshuffle: false,
};

function sanitize(cfg: Partial<DealConfig>): DealConfig {
  const player = Math.min(12, Math.max(1, Number(cfg.playerCount != null ? cfg.playerCount : DEFAULT_CONFIG.playerCount)));
  const per = Math.min(10, Math.max(1, Number(cfg.perTime != null ? cfg.perTime : DEFAULT_CONFIG.perTime)));
  const deck = (cfg.deckCount === 2 ? 2 : 1) as 1 | 2;
  const mode: DealMode = cfg.dealMode === 'simultaneous' ? 'simultaneous' : 'round';
  return {
    deckCount: deck,
    includeJokers: Boolean(cfg.includeJokers != null ? cfg.includeJokers : DEFAULT_CONFIG.includeJokers),
    playerCount: player,
    dealMode: mode,
    perTime: per,
    reshuffle: Boolean(cfg.reshuffle != null ? cfg.reshuffle : DEFAULT_CONFIG.reshuffle),
  };
}

export function getConfig(): DealConfig {
  try {
    const v = wx.getStorageSync(STORAGE_KEY);
    if (!v) return DEFAULT_CONFIG;
    const parsed = JSON.parse(v);
    return sanitize(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setConfig(partial: Partial<DealConfig>): DealConfig {
  const current = getConfig();
  const merged = sanitize(Object.assign({}, current, partial));
  try { wx.setStorageSync(STORAGE_KEY, JSON.stringify(merged)); } catch {}
  return merged;
}

export function clearConfig() {
  try { wx.removeStorageSync(STORAGE_KEY); } catch {}
}

export const ConfigStorage = { getConfig, setConfig, clearConfig };

export function getSkipRuleChangeTip(): boolean {
  try { return Boolean(wx.getStorageSync(TIP_KEY)); } catch { return false; }
}
export function setSkipRuleChangeTip(skip: boolean) {
  try { wx.setStorageSync(TIP_KEY, skip ? '1' : ''); } catch {}
}


