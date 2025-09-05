import { getConfig, DealConfig } from '../../utils/config';

type Suit = '♠' | '♥' | '♣' | '♦' | 'JOKER';
interface Card { suit: Suit; rank: string; }

interface PlayerState {
  name: string;
  pile: Card[];
  x: number; // percent left
  y: number; // percent top
  anchor: 'top' | 'bottom' | 'middle';
}

interface IData {
  maxWidth: number;
  scale: number;
  cfg: DealConfig;
  deck: Card[];
  remain: number;
  players: PlayerState[];
  currentIndex: number; // 循环发牌当前玩家
  cardBack: string;
  expose: number; // 每张历史牌堆露出的高度（rpx）
  cornerH: number; // 牌面角标高度（rpx）
}

const STORAGE_KEY = 'deal-game-state:v1';

function buildDeck(cfg: DealConfig): Card[] {
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const suits: Suit[] = ['♠','♥','♣','♦'];
  const one: Card[] = [];
  for (const s of suits) for (const r of ranks) one.push({ suit: s, rank: r });
  if (cfg.includeJokers) { one.push({ suit: 'JOKER', rank: 'J' }); one.push({ suit: 'JOKER', rank: 'j' }); }
  let deck: Card[] = [];
  for (let i=0;i<cfg.deckCount;i++) deck = deck.concat(one);
  // 洗牌
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function layoutFor(count: number): Array<{x:number,y:number}> {
  // 预设布局（百分比）。中心(50,50)留发牌区
  switch (count) {
    case 1: return [];
    case 2: return [{x:50,y:18},{x:50,y:82}];
    case 3: return [{x:50,y:18},{x:12,y:78},{x:88,y:78}];
    case 4: return [{x:50,y:15},{x:88,y:50},{x:50,y:78},{x:12,y:50}];
    case 5: return [{x:50,y:12},{x:88,y:40},{x:70,y:78},{x:30,y:78},{x:12,y:40}];
    case 6: return [{x:50,y:12},{x:88,y:28},{x:88,y:60},{x:50,y:78},{x:12,y:60},{x:12,y:28}];
    case 7: return [{x:50,y:12},{x:88,y:28},{x:88,y:54},{x:88,y:80},{x:12,y:80},{x:12,y:54},{x:12,y:28}];
    case 8: return [{x:50,y:12},{x:88,y:28},{x:88,y:46},{x:88,y:64},{x:50,y:80},{x:12,y:64},{x:12,y:46},{x:12,y:28}];
    default: return [];
  }
}

function saveState(data: IData) {
  const payload = {
    deck: data.deck,
    remain: data.remain,
    players: data.players,
    currentIndex: data.currentIndex,
    cfg: data.cfg,
  };
  try { wx.setStorageSync(STORAGE_KEY, JSON.stringify(payload)); } catch {}
}

function restoreState(): Partial<IData> | null {5
  try {
    const v = wx.getStorageSync(STORAGE_KEY);
    if (!v) return null;
    return JSON.parse(v);
  } catch { return null; }
}

Page<IData, any>({
  data: {
    maxWidth: 414,
    scale: 1,
    cfg: getConfig(),
    deck: [],
    remain: 0,
    players: [],
    currentIndex: 0,
    cardBack: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420"><rect width="100%" height="100%" rx="20" ry="20" fill="%2316863a"/><circle cx="150" cy="210" r="120" fill="none" stroke="%23fff" stroke-width="8"/></svg>',
    expose: 8,
    cornerH: 30
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    const maxWidth = Math.min(sys.windowWidth, 480);
    const scale = Math.max(0.92, Math.min(1.08, sys.windowWidth / 414));
    const cfg = getConfig();

    const restored = restoreState();
    if (restored && restored.players && Array.isArray(restored.players) && restored.deck) {
      this.setData({ maxWidth, scale, cfg, deck: restored.deck, remain: restored.remain, players: restored.players, currentIndex: restored.currentIndex });
      return;
    }

    const deck = buildDeck(cfg);
    const positions: Array<{x:number;y:number}> = layoutFor(cfg.playerCount);
    const players: PlayerState[] = positions.map((p: {x:number;y:number}, i: number): PlayerState => ({
      name: `玩家${i+1}`,
      pile: [],
      x: p.x,
      y: p.y,
      // 顶部与中部：名称在上、堆在下；底部：名称在上、堆在下（避免覆盖）
      anchor: p.y > 60 ? 'bottom' : 'top'
    }));
    // 根据玩家数自适应缩放卡片露出与角标高度
    let expose = this.data.expose;
    if (cfg.playerCount >= 6) { expose = 8; }
    if (cfg.playerCount >= 7) { expose = 6; }
    this.setData({ maxWidth, scale, cfg, deck, remain: deck.length, players, currentIndex: 0, expose });
    saveState(this.data);
  },

  deal() {
    if (this.data.remain <= 0) {
      wx.showToast({ title: '没有剩余牌', icon: 'none' });
      return;
    }
    const cfg = getConfig();
    this.setData({ cfg });
    if (cfg.dealMode === 'simultaneous') {
      this.dealSimultaneous(cfg.perTime);
    } else {
      this.dealRound(cfg.perTime);
    }
    if (cfg.reshuffle) {
      // 重洗并清空历史堆
      const deck = buildDeck(cfg);
      const players = this.data.players.map((p: PlayerState) => ({ ...p, pile: [] }));
      this.setData({ deck, remain: deck.length, players, currentIndex: 0 });
    }
    saveState(this.data);
  },

  dealRound(per: number) {
    let deck = [...this.data.deck];
    const players = this.data.players.map((p: PlayerState) => ({ ...p }));
    let idx = this.data.currentIndex;
    for (let i = 0; i < per; i++) {
      if (deck.length === 0) break;
      const card = deck.pop() as Card;
      players[idx].pile = [card, ...players[idx].pile];
    }
    idx = (idx + 1) % players.length;
    this.setData({ deck, remain: deck.length, players, currentIndex: idx });
  },

  dealSimultaneous(per: number) {
    let deck = [...this.data.deck];
    const players = this.data.players.map((p: PlayerState) => ({ ...p }));
    for (let k = 0; k < per; k++) {
      for (let i = 0; i < players.length; i++) {
        if (deck.length === 0) break;
        const card = deck.pop() as Card;
        players[i].pile = [card, ...players[i].pile];
      }
    }
    this.setData({ deck, remain: deck.length, players });
  },

  resetGame() {
    const cfg = getConfig();
    const deck = buildDeck(cfg);
    const positions: Array<{x:number;y:number}> = layoutFor(cfg.playerCount);
    const players: PlayerState[] = positions.map((p: {x:number;y:number}, i: number): PlayerState => ({
      name: `玩家${i+1}`,
      pile: [],
      x: p.x,
      y: p.y,
      anchor: p.y > 60 ? 'bottom' : 'top'
    }));
    this.setData({ cfg, deck, remain: deck.length, players, currentIndex: 0 });
    saveState(this.data);
  },

  backToSetup() {
    wx.navigateBack({});
  }
});


