## 页面样式与开发规范（Poker Mini Program）

本规范用于指导后续页面的界面实现与代码结构，确保视觉与交互一致、易于维护与扩展。

### 1. 布局与适配
- **单列定宽容器**: 页面主体容器固定居中显示，`maxWidth ≤ 480px`，避免在超宽设备上铺满导致控件过长。
- **轻量缩放 B+C 方案**: 计算 `--scale = clamp(windowWidth / 414, 0.92, 1.08)`，仅对关键尺寸（标题字号、卡片内边距、按钮高度、步进器尺寸、图标尺寸等）做 `calc(px * var(--scale))` 微缩放。
- **安全区**: 
  - 顶部：`padding-top: env(safe-area-inset-top)`（在自定义标题栏处处理）。
  - 底部：粘底按钮容器加入 `padding-bottom: env(safe-area-inset-bottom)`，并在页面主体底部留出足够空间以避免遮挡。
- **单位**: 优先使用 `px + var(--scale)`；仅在需要自适应栅格时使用 `grid/flex` 百分比。避免大面积 `rpx` 以保持像素级阴影/边框精度。

示例（容器与缩放变量注入）:
```xml
<view class="page" style="max-width: {{maxWidth}}px; --scale: {{scale}};">
  ...
</view>
```

```scss
.page {
  padding: calc(12px * var(--scale)) calc(16px * var(--scale)) calc(88px * var(--scale));
}
```

### 2. 主题与设计 Token
- **颜色**
  - 主色（绿色）：`#16863a`，按压态：`#0f6a2d`
  - 文本主色：`#1a1a1a`；副文本：`#6b7280`
  - 分割线/描边：`#e5e7eb`
  - 卡片背景：`#ffffff`
- **圆角**: 卡片 `14px`；按钮 `8–10px`；头像/单选圆形 `999px`。
- **阴影**: `0 6px 16px rgba(0,0,0,.06)`，可按场景压低或移除，以描边为主。
- 建议将 Token 抽到 `styles/_variables.scss`，并在页面 `scss` 中引用。

### 3. 字体与字重
- **仅以下标题加粗（700）**：`牌组配置 / 玩家设置 / 发牌配置` 等卡片区块标题。
- 其余文字统一**常规字重（400）**，避免视觉噪点。
- 标题字号随 `--scale` 缩放：`font-size: calc(18px * var(--scale))`；其他正文字号按 13–14px 基线微调。

### 4. 组件样式规范
- **卡片（section）**
  - 背景白色、圆角 14px、浅描边 + 轻阴影、内边距 `calc(14px * var(--scale))`。
- **分段按钮（seg-btn）**
  - 两列 `grid`：`grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px`。
  - 高度 `calc(40px * var(--scale))`，文字居中（flex），禁用/按压态可见。
  - 活动态底色主绿、文字白色，非激活浅灰底。
- **步进器（stepper）**
  - 按钮 44×36（随 `--scale`）；符号水平纵向剧中；数值颜色用主绿。
- **单选组（radio-group）**
  - 选中：外环主绿 + 内圆填充；未选中：浅灰描边。
- **分割线（divider）**
  - 颜色使用边框色；上下外边距 `calc(12px * var(--scale))`。
- **是/否分段（seg-yesno）**
  - 小按钮 `inline-flex`，`min-width: 44px`，不占满父容器，文字常规字重。
- **主按钮（footer .primary）**
  - 高度 `calc(48px * var(--scale))`，圆角胶囊，粘底并留安全区。

### 5. 图标
- 统一使用本地 **SVG** 或 Iconfont，不使用 emoji，以避免跨平台渲染差异。
- 基础尺寸 `20px`（随 `--scale`），颜色使用主绿或文本色；在标题中置于浅绿色圆角底。

### 6. 行为与数据
- **配置持久化**：统一使用 `miniprogram/utils/config.ts` 提供的接口：
  - `getConfig(): DealConfig` 获取（带默认值与校验）
  - `setConfig(partial: Partial<DealConfig>): DealConfig` 合并后写入
  - `clearConfig(): void` 清理本地配置
  游戏页在 `onLoad` 中直接 `const cfg = getConfig()` 读取。
- **导航**：使用 `navigationStyle: custom` 的自定义头部；其它辅助页可复用组件库导航。
- **交互三态**：所有按钮需具备 `默认 / 按压 / 禁用` 态，按压态可使用 `filter: brightness(0.98)` 或颜色加深。

### 7. 类型与命名
- TypeScript 避免 `any`；为页面 `Page<IData, Methods>` 显式标注数据结构与方法签名。
- 命名风格：
  - 数据字段为含义明确的名词，如 `playerCount`、`dealMode`。
  - 事件处理用动词短语，如 `incPlayers`、`setDealMode`、`toggleJokers`。

### 8. 代码结构建议
- 每个页面包含：`index.wxml / index.ts / index.scss / index.json`，只在页面内声明该页特有样式。
- 通用样式（卡片/分段/步进器等）沉淀为可复用的 SCSS 片段或 mixin，在页面中引用。
- 图片和 SVG 统一放在 `miniprogram/assets/`，按模块分文件夹。

### 9. 可访问性与触控
- 控件触控高度不小于 `36px`，点击热区与视觉元素一致。
- 颜色对比度满足基本可读性（文本与背景对比 ≥ 4.5:1 为宜）。

### 10. 质量校验清单（开发自查）
- 布局在 320 / 360 / 414 / 430–480 宽度设备上无溢出、无拥挤。
- 纵向滚动时粘底按钮不遮挡内容；顶部与底部安全区有效。
- 仅卡片标题加粗；其他文本权重一致。
- 配置项修改后可立即写入本地并在重进页面回填。
- icon、字号、间距与设计 Token 一致。

### 11. 页面样板（建议复用）
```xml
<!-- pages/sample/index.wxml -->
<view class="page" style="max-width: {{maxWidth}}px; --scale: {{scale}};">
  <view class="header"><view class="title">标题</view></view>
  <view class="section">
    <view class="section-title"><text class="icon">★</text><text>区块标题</text></view>
    <view class="btn-grid">
      <button class="seg-btn active">选项A</button>
      <button class="seg-btn">选项B</button>
    </view>
  </view>
  <view class="footer"><button class="primary">主要操作</button></view>
</view>
```

```ts
// pages/sample/index.ts（核心字段与缩放/存储示例）
interface IData {
  maxWidth: number;
  scale: number;
}
Page<IData, {}>({
  data: { maxWidth: 414, scale: 1 },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    const safeMax = Math.min(sys.windowWidth, 480);
    const scale = Math.max(0.92, Math.min(1.08, sys.windowWidth / 414));
    this.setData({ maxWidth: safeMax, scale });
  }
});
```

---
如需修改或扩展规范，请直接编辑本文件并在 PR 中说明变更点与影响面。


