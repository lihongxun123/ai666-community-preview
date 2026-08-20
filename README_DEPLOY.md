# AI666 社区模块公网静态预览包

生成时间：2026-08-20T14:53:45.745Z

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
- 模型详情: model-detail.html
- 闪念: flash.html
- 官方教程: tutorial.html
- 教程详情: tutorial-detail.html
- 活动中心: activity-center.html
- 赛事活动说明: competition-detail.html
- 赛事参赛作品 · 作品广场: competition-works.html
- 赛事我的投稿: competition-my-submissions.html
- 赛事投稿: competition-submit.html
- 赛事作品详情: competition-work.html
- 赛事参赛作品 · 排行榜: competition-ranking.html
- 赛事指南兼容页: competition-guide.html
- 赛事参赛规则: competition-rules.html
- 活动详情: campaign-detail.html
- Prompt 共创计划: campaign-prompt.html
- Prompt 投稿: prompt-submit.html
- Prompt 详情: prompt-detail.html
- 新手任务: campaign-new-user.html
- 七日成长任务: campaign-seven-day.html
- 消息中心: message-center.html
- 积分中心: points-center.html
- 邀请有礼: invite.html
- 登录承接: login.html
- AI商城: member-store.html
- 用户中心: user-center.html

## 调试页

- 赛事 C 端状态预览台: competition-state-preview.html
- 内容详情弹层调试台: content-detail-modals.html
- 一期活动预览入口: campaign-ops.html
- 漫剧创作转场页: manga-handoff.html
- 移动端 H5 · 首页: mobile-home.html
- 移动端 H5 · 社区: mobile-community.html
- 移动端 H5 · 图片详情: mobile-image-detail.html
- 移动端 H5 · 视频详情: mobile-video-detail.html
- 移动端 H5 · 创作首页: mobile-create.html
- 移动端 H5 · 图片生成: mobile-create-image.html
- 移动端 H5 · 视频生成: mobile-create-video.html
- 移动端 H5 · 生成中与恢复: mobile-generation-progress.html
- 移动端 H5 · 生成结果: mobile-generation-result.html
- 移动端 H5 · 活动: mobile-activity.html
- 移动端 H5 · 通用活动详情: mobile-activity-detail.html
- 移动端 H5 · AI 生图创作挑战: mobile-campaign-detail.html
- 移动端 H5 · 投稿详情: mobile-submission-detail.html
- 移动端 H5 · 我的: mobile-my.html
- 移动端 H5 · 编辑个人资料: mobile-profile-edit.html
- 移动端 H5 · 我的内容: mobile-my-works.html
- 移动端 H5 · 我的投稿: mobile-my-submissions.html
- 移动端 H5 · 新手任务: mobile-tasks.html
- 移动端 H5 · 积分中心: mobile-points.html
- 移动端 H5 · 积分记录: mobile-points-records.html
- 移动端 H5 · AI商城: mobile-exchange.html
- 移动端 H5 · 兑换记录: mobile-exchange-records.html
- 移动端 H5 · 邀请有礼: mobile-invite.html
- 移动端 H5 · 消息中心: mobile-messages.html

## 边界

- 这是静态高保真探索稿，不是真实生产站。
- 不连接真实登录、发帖、支付、后台、积分、卡密、API Key 或用户数据。
- 已写入 robots.txt 和 noindex，默认不建议搜索引擎收录。
- GitHub Pages 使用时，根目录包含 .nojekyll，用于避免下划线目录被 Jekyll 忽略。
