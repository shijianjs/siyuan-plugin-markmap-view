# AGENTS.md

思源 markmap 视图插件的开发与集成测试约定。跨上下文需要知道的事实集中在这里，具体实现见代码。

## 1. 项目与命令

- pnpm + Vite 模板插件；插件名 `siyuan-plugin-markmap-view`（`plugin.json` 里的 `name` 是内核识别的唯一键）。
- `pnpm dev`：watch 开发构建，产物在 `dev/`，livereload 只在 `WATCH=1` 时启用（见 `vite.config.ts`）。
- `pnpm build:dev`：一次性开发构建，产物同样写入 `dev/`，进程会正常结束；`build:dev` **不**打 `package.zip`。
- `pnpm build`：生产构建并打包 `package.zip`（zip 只在 `NODE_ENV=production` 时启用）。
- `pnpm test` = `build:dev` + `playwright test`；`pnpm test:only` 跳过构建；`pnpm test:typecheck` 只做类型检查。

## 2. 本地开发环境

- 本地思源内核：`http://127.0.0.1:8950`（工作空间 `S:\my\siyuan\siyuan-debug`）。可用 `SIYUAN_BASE_URL` 覆盖。
- 工作空间里的插件目录是指向本仓库 `dev/` 的**符号链接**（`pnpm make-link`），所以本地改代码后要 `pnpm dev` 或 `pnpm build:dev` 才能生效。
- 前端入口固定用 `/stage/build/desktop/`，不要改成浏览器版资源（原因见第 4 节）。
- 上游资料（GitHub 源码、文档）一律读本地克隆，**不要访问 `raw.githubusercontent.com`，也不要用网页
  抓取 GitHub**：国内网络经常超时。目录约定与可参考的第三方克隆见 `../AGENTS.md`；缺仓库时按它用
  `gh repo clone` 克隆到本地再读。

## 3. 集成测试（Playwright）

- 用例在 `tests/`，配置 `playwright.config.ts`，风格参考 `S:\workspace\github\siyuan-note\siyuan-testing`（不要直接依赖它）。
- 串行执行（`workers: 1`）：停靠栏、设置面板、dock 可见性都是全局 UI 状态。
- 所有文档建在 `Markmap E2E Testing` 笔记本，标题带功能前缀 + 随机后缀；通过用例会删除自己创建的文档，失败/超时则保留并作为附件写入报告。
- `tests/helpers/` 放复用逻辑：`siyuanAPI.ts`（内核 API）、`runtime.ts`（打开工作空间 / dock / 弹窗）、`plugin.ts`（导图与插件 UI 定位）、`settings.ts`（设置面板，按当前界面语言定位，避免写死中英文）。
- `global-setup` / `global-teardown` 负责：校验内核、准备笔记本、**打开集市信任与全局插件开关**、启用插件，并在结束后原样还原。

### 内核侧必须知道的事实

- 插件设置保存在 `data/storage/petal/<plugin>/settings.json`（思源 3.8 已从 `data/plugins/<name>/` 迁走）。`/api/file/getFile` 成功时返回的是**原始文件内容**，不是 `{code,msg,data}` 包装。
- `Setting` 对话框底部有「保存」按钮，插件设置只有点保存才会落盘并生效；UI 上的输入本身不会自动保存（`SettingUtils` 没给这些项绑 `action.callback`），这是既有设计，不要在测试里假设自动保存。
- `b3-dialog__close` 常被 `fn__none` 隐藏；关闭对话框统一用 `Escape`。
- dock 的 `data-type` 会被内核加上插件名前缀（`<pluginName><type>`），面板类名是 `sy__<pluginName><type>.dockPanel`，要用 `:visible` 过滤。
- 设置面板是 `SettingUtils` 里 `new Setting()` 产生的**独立**对话框（不是设置中心 tab），项结构为 `.b3-label.config-item` + `.config-name`。

## 4. CI 流水线（`.github/workflows/e2e.yml`）

push / PR 到 `main` 自动运行；`gh workflow run e2e.yml -f spec=tests/xxx.spec.ts` 可只跑单个文件。

- 流程：`pnpm install` → `build:dev` → 复制 `dev/` 到 `ci-workspace/data/plugins/<name>` → 下载官方**桌面版 AppImage** → `--appimage-extract` → `SiYuan-Kernel serve --wd=<appdir> --workspace=ci-workspace --port=6806` → `playwright install --with-deps chrome` → 跑 Playwright。
- 失败上传 `playwright-report` / `test-results` / `siyuan-kernel.log`；始终打印内核的 petal/plugin 日志。

### 走过的弯路，不要再走

- **一开始用的是 `b3log/siyuan` 官方 Docker 镜像，跑不通**。原因：Docker 镜像提供的是浏览器前端资源，`app/src/util/hostCapabilities.ts` 的 `plugins: !remoteKernel || trustedExtensions` 直接为 false，前端**完全不加载任何插件**。现象是页面能渲染（`.dock__item` 这些是静态骨架）但插件的 dock / 顶栏图标都不存在，`/api/petal/loadPetals` 返回空数组。已改为官方桌面版内核，**不要再退回 docker 镜像**。
- 新版内核在容器模式下强制要求 `SIYUAN_ACCESS_AUTH_CODE`（或 OIDC），否则拒绝启动；桌面版 kernel 二进制不需要该变量。
- AppImage 资源名不带 `v` 前缀：`siyuan-<版本>-linux.AppImage`；解压后内核在 `resources/kernel/SiYuan-Kernel`，前端资源在 `resources/stage/build/desktop/`（不是 `app/stage/...`）。工作流里用 `find` 定位，别写死路径。
- **真正的根因**：`kernel/model/plugin.go` 的 `petalsEnabled()` 在 `container == std | docker` 时要求 `conf.bazaar.trust === true`，否则内核静默不加载任何插件。全新工作空间默认 `trust=false`，所以 CI 里必须由 `global-setup` 打开集市信任（同时确保 `petalDisabled=false`），否则所有用例都会因为找不到插件 UI 而失败。
- `setup-node` 的 `cache: pnpm` 要求先装 pnpm；且 `pnpm-lock.yaml` 必须在版本控制里（此前被 `.gitignore` 忽略，导致 CI 装依赖直接失败）。
- YAML 文件写入要避免 UTF-8 BOM：带 BOM 的 workflow 会被 GitHub 判为「workflow file issue」而整个 run 失败。PowerShell 的 `Set-Content`/`Out-File` 也会破坏中文注释，workflow 内统一用英文注释。

### 持续集成（Dependabot 与自动合并）

- `.github/dependabot.yml`：每周一检查 npm 依赖与 GitHub Actions，上限 5 个并发 PR，打 `dependencies` 标签，commit 前缀 `chore(deps)` / `chore(ci)`。
- `.github/workflows/auto-merge.yml`：在 PR 的 E2E 全部通过后 squash 合并。
  - 触发：`pull_request_target`（opened / reopened / synchronize / ready_for_review），也支持 `workflow_dispatch -f pr=<编号>` 手动补跑。
  - **等待时必须忽略本工作流自己的 check**（`Merge when checks pass`），否则它永远处于 in_progress，任务会自锁到超时。
  - `concurrency` 组要用 `${{ github.event.inputs.pr || github.event.pull_request.number }}`：`workflow_dispatch` 没有 `pull_request` 负载，否则所有手动触发的 run 会互相取消。
  - GitHub 异步计算 mergeable，会先返回 `UNKNOWN`，需要轮询重试几次。
  - `GITHUB_TOKEN` **没有 `workflows` 权限**（写进 `permissions:` 会直接让 workflow 解析失败），因此修改 `.github/workflows/**` 的 PR（例如 Dependabot 升级 actions）默认跳过，留给人工合并；若配置了细粒度 PAT 密钥 `GH_PAT`（contents + pull requests write），则用 `GH_PAT` 合并，这类 PR 也能自动合。
- 改动 CI 后建议用 `gh run view <id>` 复核线上结果；workflow 文件不能带 UTF-8 BOM。

## 5. 提交约定

- 除非用户明确要求，不要自行 commit / push。
- 涉及测试或 CI 的改动请实际跑一次：本地 `npx playwright test`，并用 `gh run view <id>` 确认线上流水线状态。