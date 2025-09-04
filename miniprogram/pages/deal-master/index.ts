// pages/deal-master/index.ts
import { ConfigStorage, getConfig, setConfig, DealConfig } from '../../utils/config';
interface IData {
    maxWidth: number;
    scale: number;
    deckCount: 1 | 2;
    includeJokers: boolean;
    playerCount: number;
    dealMode: 'round' | 'simultaneous';
    perTime: number;
    reshuffle: boolean;
    loading: boolean;
    avatarUrl: string;
  }
  
  Page<IData, {
    onDeckCount: (e: WechatMiniprogram.TouchEvent) => void;
    toggleJokers: () => void;
    incPlayers: () => void;
    decPlayers: () => void;
    setDealMode: (e: WechatMiniprogram.TouchEvent) => void;
    incPerTime: () => void;
    decPerTime: () => void;
    setReshuffle: (e: WechatMiniprogram.TouchEvent) => void;
    startGame: () => void;
  }>({
    data: {
      maxWidth: 414, // iPhone 11 基准，启动时会根据屏幕宽度更新
      scale: 1,
      deckCount: 1,
      includeJokers: true,
      playerCount: 4,
      dealMode: 'round',
      perTime: 1,
      reshuffle: false,
      loading: false,
      avatarUrl: 'https://dummyimage.com/120x120/eeeeee/333333&text=%F0%9F%91%A8' // 占位头像，可替换
    },
  
    onLoad() {
      const sys = wx.getSystemInfoSync();
      // 为了在超大屏上保持设计感，限制一个最大宽度（比如 480）
      const safeMax = Math.min(sys.windowWidth, 480);
      const rawScale = sys.windowWidth / 414; // 以 iPhone 11 宽度为参考
      const clamped = Math.max(0.92, Math.min(1.08, rawScale));
      this.setData({ maxWidth: safeMax, scale: clamped });
      // 回填已保存的配置
      const cfg = getConfig();
      this.setData({
        deckCount: cfg.deckCount,
        includeJokers: cfg.includeJokers,
        playerCount: cfg.playerCount,
        dealMode: cfg.dealMode,
        perTime: cfg.perTime,
        reshuffle: cfg.reshuffle,
      });
    },
  
    onDeckCount(e: WechatMiniprogram.TouchEvent) {
      const val = Number(e.currentTarget.dataset.val) as 1 | 2;
      if (this.data.deckCount !== val) this.setData({ deckCount: val }, this.saveConfig);
    },
  
    toggleJokers() {
      this.setData({ includeJokers: !this.data.includeJokers }, this.saveConfig);
    },
  
    incPlayers() {
      const v = Math.min(this.data.playerCount + 1, 12);
      this.setData({ playerCount: v }, this.saveConfig);
    },
  
    decPlayers() {
      const v = Math.max(this.data.playerCount - 1, 2);
      this.setData({ playerCount: v }, this.saveConfig);
    },
  
    setDealMode(e: WechatMiniprogram.TouchEvent) {
      const mode = (e.currentTarget.dataset.mode as 'round' | 'simultaneous') || 'round';
      this.setData({ dealMode: mode }, this.saveConfig);
    },
  
    incPerTime() {
      const v = Math.min(this.data.perTime + 1, 10);
      this.setData({ perTime: v }, this.saveConfig);
    },
  
    decPerTime() {
      const v = Math.max(this.data.perTime - 1, 1);
      this.setData({ perTime: v }, this.saveConfig);
    },
  
    setReshuffle(e: WechatMiniprogram.TouchEvent) {
      const val = String(e.currentTarget.dataset.val) === '1';
      this.setData({ reshuffle: val }, this.saveConfig);
    },

    saveConfig() {
      setConfig({
        deckCount: this.data.deckCount,
        includeJokers: this.data.includeJokers,
        playerCount: this.data.playerCount,
        dealMode: this.data.dealMode,
        perTime: this.data.perTime,
        reshuffle: this.data.reshuffle,
      });
    },
  
    startGame() {
      if (this.data.loading) return;
      this.setData({ loading: true });
  
      // 模拟准备逻辑
      setTimeout(() => {
        this.setData({ loading: false });
        wx.showToast({
          title: '配置已保存，开始游戏！',
          icon: 'success'
        });
        // 真实项目可 navigateTo 到游戏页面，并透传配置
        // wx.navigateTo({ url: `/pages/game/index?cfg=${encodeURIComponent(JSON.stringify(this.data))}` })
      }, 800);
    }
  });