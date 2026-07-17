# Open Zoo Online

免費、開源、繁體中文、支援 2–4 人連線的動物園策略桌遊愛好者專案。遊戲流程涵蓋基本版及 Marine Worlds。

## 已實作

- 私人房間、六位邀請代碼、斷線重連及四個玩家座位
- 每個來源 24 小時最多建立五個房間；加入現有房間不限
- 每位玩家私密 8 選 4 起手牌、兩張終局牌、地圖 A／0／1–8
- 296 張卡牌索引：160 動物、80 贊助、39 保育計劃、17 終局牌
- 五張獨立行動卡、強度 1–5、X 標記、II 面升級及 Marine Worlds 變體
- 圍欄、亭店、涼亭、特殊建築、大小水族館及容量驗證
- 卡牌、建造、動物、贊助、協會五大伺服器判定行動
- 合作動物園、大學、新專科大學、保育計劃及捐款
- 休息軌、手牌上限、收回協會人員、展列更新、浪花及收入
- 礁居者連鎖、最後一輪、終局牌與勝負排名
- Cloudflare Worker + D1 持久化；不需要收費 API 或第三方執行依賴

## 本機開發

需要 Node.js 22.13 或以上：

```bash
npm run dev
npm test
```

本機 `npm run dev` 只預覽靜態介面及卡庫；多人房間需要 D1 環境。正式建置輸出在 `dist/`。

## Cloudflare 免費部署

專案已包含 `wrangler.jsonc`，並綁定名為 `open-zoo-online-db` 的 D1 資料庫。登入擁有該資料庫的 Cloudflare 帳戶後執行：

```bash
npm run cloudflare:deploy
```

第一次執行會要求在瀏覽器授權 Cloudflare。成功後會顯示一個 `workers.dev` 網址；資料表會在第一個房間建立時自動產生。

使用 Cloudflare Git 整合時，設定 Build command 為 `npm run build`，Deploy command 為 `npx wrangler@latest deploy`。D1 binding 名稱必須保持為 `DB`。

## 內容與授權

程式碼以 `AGPL-3.0-only` 發佈。所有介面、抽象卡面及圖示由本專案重新設計，不包含原版卡圖、掃描圖或商標。

卡名及編號用於玩家辨認。現階段卡牌能力採用資料化、可調校的遊戲模型，未宣稱逐字或逐張等同商業實體版；可在 `data/catalog.js` 逐張校正，而不需要改伺服器架構。
