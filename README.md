# 时音回响仓 · 网页演示版

把小程序版本的核心体验做成静态网页：把语音、图文封存成一颗「胶囊」，设定未来某一天才能打开；解锁时随机收到 1–2 条同期陌生人的「回声」。

不需要 AppID、不需要云开发、不需要服务器，部署到任意静态托管即可公开访问。

## 本地运行

```bash
python web/serve.py
```

或：

```bash
cd web
python -m http.server 5173
```

打开 http://localhost:5173/ 。

> 请用 `localhost` 访问，不要直接双击 `index.html`。录音（`getUserMedia`）和 ES Module 在 `file://` 下会被浏览器限制。

## 功能

- 时光仓首页：胶囊卡片、未解锁 / 已解锁筛选、倒计时进度、创建入口
- 创建胶囊：给未来的自己 / 匿名投递、封面颜色或图片、文字、照片、录音（最长 5 分钟）
- 封存中详情：倒计时、封存凭证，**解锁前不展示正文、照片与语音**
- 解锁日：正文、照片、语音播放、同期回声、收藏、举报
- 回声广场：收到的回声 / 收藏筛选
- 我的：昵称、统计、菜单、会员占位
- 隐私设置：隐藏地区、解锁提醒、清除草稿、载入演示数据、清空全部数据
- 首次打开自带演示数据；设置页可重新载入演示数据

## 数据保存在哪里

- 胶囊、回声、设置：浏览器 `localStorage`
- 语音 Blob：浏览器 `IndexedDB`
- 每台设备、每个浏览器各自独立，不会上传到服务器
- 清除浏览器数据 / 换浏览器会丢失；公开演示时每位访客看到的是自己的本地数据

## 部署到免费静态平台

### Vercel

```bash
npx vercel
```

按提示登录，项目根目录选择 `web`，Framework Preset 选 `Other`，Build Command 留空，Output Directory 填 `.`。部署完成后会得到 `https://xxx.vercel.app` 的公开链接。

### Netlify

方式一：打开 https://app.netlify.com/drop ，把整个 `web` 文件夹拖进去。

方式二：安装 CLI 后：

```bash
npx netlify deploy --dir=web --prod
```

### GitHub Pages

把 `web` 目录内容推到仓库的 `gh-pages` 分支，或在仓库 Settings → Pages 里选择对应目录。

### Cloudflare Pages

在 Cloudflare Dashboard → Pages → Upload assets，直接上传 `web` 文件夹。

部署后把公开链接发给老师/同学即可。手机和电脑都能打开。

## 已知限制

- 这是**网页演示版**，不是微信小程序本体；原小程序代码仍在 `../时音回响仓/`
- 数据存在浏览器本地，没有账号体系，换设备不同步
- 解锁倒计时以本机时间为准；客户端可以修改系统时间，仅用于演示
- 回声是内置的演示文案，不是真实用户匹配
- 录音需要浏览器授权麦克风；Safari 对 MediaRecorder 的支持视版本而定
- 图片会压缩后存进 `localStorage`，数量过多可能触发浏览器配额限制

## 设计来源

配色、间距与组件规范来自《时音回响仓——需求分析与 UI 设计》表 5、表 7：夜幕蓝 `#343E6E`、暖金 `#E8B86D`、米白 `#FAF7F2`，页面左右 32rpx 边距、卡片 32rpx 圆角、主按钮 96rpx 高度。
