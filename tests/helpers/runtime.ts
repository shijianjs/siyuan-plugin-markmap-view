import {expect, Page} from "@playwright/test";
import {SiyuanAPI} from "./siyuanAPI";

/** 本地思源测试内核地址，可用 SIYUAN_BASE_URL 覆盖。 */
export const DEFAULT_BASE_URL = "http://127.0.0.1:8950";

export const PLUGIN_NAME = "siyuan-plugin-markmap-view";
/** 插件注册的快捷键（plugin.json 中的 ⌥⌘M，Windows 为 Ctrl+Alt+M）。 */
export const MARKMAP_HOTKEY = "Control+Alt+M";

export const getBaseURL = () => process.env.SIYUAN_BASE_URL || DEFAULT_BASE_URL;

/** 校验目标内核可用，并打印工作空间信息；仅允许回环地址。 */
export const validateTestTarget = async (api: SiyuanAPI, baseURL: string) => {
    const target = new URL(baseURL);
    const isLoopback = ["127.0.0.1", "localhost", "::1"].includes(target.hostname);
    if (!isLoopback && process.env.SIYUAN_ALLOW_REMOTE !== "1") {
        throw new Error(
            `拒绝针对非回环地址 ${target.origin} 运行测试，只有显式设置 SIYUAN_ALLOW_REMOTE=1 时才允许。`,
        );
    }

    let workspaceInfo: Awaited<ReturnType<SiyuanAPI["getWorkspaceInfo"]>> | undefined;
    await expect.poll(async () => {
        try {
            workspaceInfo = await api.getWorkspaceInfo();
            return true;
        } catch {
            return false;
        }
    }, {message: `等待思源内核 ${target.origin} 启动`, timeout: 20000}).toBe(true);

    console.log(`[markmap-e2e] target ${target.origin}, workspace ${workspaceInfo!.workspaceDir}, ` +
        `version ${workspaceInfo!.siyuanVer}`);
    return workspaceInfo!;
};

/** 打开桌面工作空间并等待内核 WebSocket 就绪。 */
export const openWorkspace = async (page: Page, path = "/") => {
    await page.goto(path === "/" || path.startsWith("/?") ? `/stage/build/desktop/${path.slice(1)}` : path);
    await expect(page.locator("#barSearch")).toBeVisible({timeout: 30000});
    await expect.poll(() => page.evaluate(() => {
        const runtime = window.siyuan as typeof window.siyuan & {ws?: {ws?: WebSocket}};
        return runtime.ws?.ws?.readyState;
    }), {message: "等待内核 WebSocket", timeout: 15000}).toBe(1);

    const changelogDialog = page.locator('[data-key="dialog-changelog"]');
    if (await changelogDialog.count() > 0 && await changelogDialog.isVisible()) {
        await changelogDialog.locator(".b3-dialog__scrim").click({force: true});
        await expect(changelogDialog).toHaveCount(0);
    }
};

/** 关闭所有可能残留的插件弹窗，避免测试之间互相干扰。 */
export const closePluginDialogs = async (page: Page) => {
    const dialogs = page.locator(".b3-dialog").filter({has: page.locator(".b3-dialog__container")});
    for (let index = 0; index < 10; index++) {
        const count = await dialogs.count();
        if (count === 0) {
            return;
        }
        for (let dialogIndex = 0; dialogIndex < count; dialogIndex++) {
            const dialog = dialogs.nth(dialogIndex);
            if (await dialog.isVisible()) {
                // 思源对话框统一响应 Esc，关闭按钮常常被 fn__none 隐藏
                await page.keyboard.press("Escape");
            }
        }
    }
    await expect(dialogs).toHaveCount(0);
};

export const showDock = async (page: Page) => {
    const initiallyHidden = await page.evaluate(() => window.siyuan.config.uiLayout.hideDock);
    if (initiallyHidden) {
        await page.locator("#barDock").click();
        await expect.poll(() => page.evaluate(() => window.siyuan.config.uiLayout.hideDock)).toBe(false);
    }
    return async () => {
        if (page.isClosed()) {
            return;
        }
        if (await page.evaluate(() => window.siyuan.config.uiLayout.hideDock) !== initiallyHidden) {
            await page.locator("#barDock").click();
            await expect.poll(() => page.evaluate(() => window.siyuan.config.uiLayout.hideDock))
                .toBe(initiallyHidden);
        }
    };
};

/** 切换到插件注册的停靠栏，并返回恢复函数。 */
export const showMarkmapDock = async (page: Page, dockType: string) => {
    const restoreDock = await showDock(page);
    // 内核会把插件名作为前缀拼在 dock 的 data-type 上
    const dockItem = page.locator(`.dock__item[data-type$="${dockType}"]`).first();
    await expect(dockItem).toBeVisible();
    // 停靠面板在首次激活时才被创建
    const dockPanel = page.locator(`.sy__${PLUGIN_NAME}${dockType}.dockPanel:visible`).last();

    const isActive = () => dockItem.evaluate(element =>
        element.classList.contains("dock__item--activefocus"));
    const wasActive = await isActive();
    if (!wasActive) {
        // 停靠栏可能被上一次的交互折叠，点击最多两次以激活目标面板
        for (let attempt = 0; attempt < 2; attempt++) {
            await dockItem.click();
            try {
                await expect.poll(isActive, {timeout: 5000}).toBe(true);
                break;
            } catch {
                if (attempt === 1) {
                    await restoreDock();
                    throw new Error("无法激活 markmap 停靠栏");
                }
            }
        }
    }
    await expect(dockPanel).toBeVisible({timeout: 15000});
    await expect(dockPanel.locator(".markmap-view-svg")).toBeVisible({timeout: 15000});

    return async () => {
        if (page.isClosed()) {
            return;
        }
        try {
            if (!wasActive && await isActive()) {
                await dockItem.click();
            }
        } finally {
            await restoreDock();
        }
    };
};