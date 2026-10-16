# 思源 markmap 视图插件

[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/shijianjs/siyuan-plugin-markmap-view)
![Downloads](https://img.shields.io/badge/dynamic/json?url=http%3A%2F%2Fbazaar.b3logfile.com%2Fbazaar%2Findex.json&query=%24%5B%22shijianjs%2Fsiyuan-plugin-markmap-view%22%5D.downloads&label=Downloads)

[English](./README.md)

## 操作
- 安装插件
- 右上角工具栏会出现图标
- 打开一个文档
- 点击图标，弹出markmap视图
  - 或使用快捷键 `Ctrl + Alt + M`

## 配置

### 全局配置
- 操作
  - 点击插件的配置按钮
- 支持大部分官方配置项：
  - 感谢 [adadaadadade](https://github.com/adadaadadade) 提供 [pr](https://github.com/shijianjs/siyuan-plugin-markmap-view/pull/9)

### 文档级配置
参考：https://markmap.js.org/docs/json-options
- 也就是在文档的开头添加两个 `---`，中间的内容填配置项，语法是`yaml`；
- 文档的`Option List`是支持的配置项列表；

示例：
```markdown
---
markmap:
  initialExpandLevel: 4
---

思源笔记markdown正文内容

```

## 集成测试（Playwright）

本仓库内置 Playwright 端到端测试，目标是**已运行的思源内核**（默认 `http://127.0.0.1:8445`，可用环境变量 `SIYUAN_BASE_URL` 覆盖）。

前置条件：

1. 思源内核已启动，并通过 `pnpm make-link`（或手动放置）把本仓库挂载到该工作空间的 `data/plugins/siyuan-plugin-markmap-view`。
2. 插件在思源「插件」设置中已启用；若被禁用，测试启动时会临时启用，结束时自动恢复原状态。
3. `pnpm exec playwright install chrome`（配置使用本机 Chrome 通道）。

常用命令：

| 命令 | 说明 |
|------|------|
| `pnpm test` | 先执行 `build:dev`（产物输出到 `dev/`），再运行全部测试 |
| `pnpm test:only` | 不重新构建，直接运行测试 |
| `pnpm test:headed` / `pnpm test:ui` | 有头 / UI 模式，便于调试 |
| `pnpm test:typecheck` | 对测试代码做类型检查 |

测试约定：

- 所有文档都创建在 `Markmap E2E Testing` 笔记本中，标题带功能前缀与随机后缀。
- 成功的用例会删除自己创建的文档；失败、超时或中断时保留文档，并作为附件写入报告。
- 停靠栏、设置面板等全局 UI 状态会在用例结束时恢复。

## 更新日志

| 版本 | 主要更新 |
|------|---------|
| v1.6.1 | 修复工具栏显示问题 |
| v1.6.0 | 支持侧边窗口打开 |
| v1.5.0 | 修复导出 markdown 模式配置问题，新增多项可配置项 |
| v1.4.0 | 添加节点最大宽度配置，支持自动换行 |
| v1.3.0 | 导出图片功能，改进折叠节点展示 |
| v1.2.0 | 自适应亮色/暗色主题 |
| v1.1.0 | 快捷键支持，默认折叠层级配置 |
| v1.0.1 | 多项优化，解决块引用嵌套 |
| v1.0.0 | 🎉 首次发布 |



## 感谢

- [markmap](https://markmap.js.org/)
- [siyuan](https://github.com/siyuan-note/siyuan)
