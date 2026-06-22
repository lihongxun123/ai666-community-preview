# AI666 社区模块公网静态预览包

生成时间：2026-06-22T10:31:21.444Z

## 用途

本目录是社区新版首页与模块探索稿的独立静态预览包。它与旧 C端 13 页公网预览分开部署，避免入口和版本边界混淆。

## 上传目录

```text
outputs/community-public-preview/
```

## 本地命令

```powershell
npm.cmd run build:community:public-preview
npm.cmd run validate:community:public-preview
```

## 公网项目站路径

```text
/ai666-community-preview/
```

## 页面

- 社区首页: index.html
- AIGC: aigc.html
- AIGC 模板库: aigc-templates.html
- 模型广场: model-plaza.html
- 闪念: flash.html
- 官方教程: tutorial.html
- 活动运营位: campaign-ops.html
- 活动详情: campaign-detail.html
- 用户成长轻中心: user-growth.html

## 边界

- 这是静态高保真探索稿，不是真实生产站。
- 不连接真实登录、发帖、支付、后台、积分、卡密、API Key 或用户数据。
- 已写入 robots.txt 和 noindex，默认不建议搜索引擎收录。
- GitHub Pages 使用时，根目录包含 .nojekyll，用于避免下划线目录被 Jekyll 忽略。
