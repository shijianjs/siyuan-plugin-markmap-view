import {expect, Locator, Page} from "@playwright/test";
import {MARKMAP_HOTKEY, PLUGIN_NAME} from "./runtime";

export const DOCK_TYPE = "markmap_dock";
/** 插件设置文件在工作空间中的相对路径（相对 /data）。 */
export const SETTINGS_FILE = "storage/petal/siyuan-plugin-markmap-view/settings.json";

export const MARKDOWN_SAMPLE = `# Markmap Root

## Branch Alpha

- alpha item one
- alpha item two

## Branch Beta

### Beta Child

- beta item one
`;

/** 打开文档，等待编辑器加载完成并返回正文区域。 */
export const getDocumentEditor = async (page: Page, docID: string) => {
    const titleSelector = `.protyle-title[data-node-id="${docID}"]`;
    await expect(page.locator(`${titleSelector}:visible`).last()).toBeVisible({timeout: 15000});
    const titleElement = page.locator(`${titleSelector}:visible`).last();
    const visibleProtyle = titleElement.locator(
        "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' protyle ')][1]",
    );
    const tabID = await visibleProtyle.getAttribute("data-id");
    const protyle = tabID ? page.locator(`.protyle[data-id="${tabID}"]`) : visibleProtyle;
    await expect(protyle).toHaveAttribute("data-loading", "finished", {timeout: 15000});
    const editor = protyle.locator(".protyle-wysiwyg").first();
    await expect(editor).toBeVisible({timeout: 10000});
    return editor;
};

/** 通过插件注册的快捷键打开 markmap 对话框。 */
export const openMarkmapDialog = async (page: Page, title?: string) => {
    await page.locator(".protyle-wysiwyg").first().click();
    await page.keyboard.press(MARKMAP_HOTKEY);
    const dialog = page.locator(".b3-dialog").filter({has: page.locator(".markmap-view-svg")}).last();
    await expect(dialog).toBeVisible({timeout: 15000});
    if (title) {
        await expect(dialog).toContainText(`Markmap - ${title}`);
    }
    await expectMarkmapRendered(dialog.locator(".markmap-view-svg"));
    return dialog;
};

/** 等待 markmap 渲染出节点，而不是简单等待时间。 */
export const expectMarkmapRendered = async (svg: Locator) => {
    await expect(svg).toBeVisible();
    await expect(svg.locator("g.markmap-node")).not.toHaveCount(0, {timeout: 20000});
};

/** 读取当前可见的 markmap 节点文本。 */
export const readMarkmapNodes = async (container: Locator) => {
    const nodes = container.locator("g.markmap-node");
    // SVG <g> 的可见性计算不可靠，这里只等待节点出现
    await expect(nodes.first()).toBeAttached({timeout: 20000});
    const count = await nodes.count();
    const texts: string[] = [];
    for (let index = 0; index < count; index++) {
        texts.push(((await nodes.nth(index).textContent()) ?? "").trim());
    }
    return texts.filter(Boolean);
};

/** 读取插件停靠栏中的 markmap 容器。 */
export const getMarkmapDock = async (page: Page) => {
    // 内核会把插件名作为前缀拼在 dock 的 data-type 上
    const dock = page.locator(`.sy__${PLUGIN_NAME}${DOCK_TYPE}.dockPanel:visible`).last();
    await expect(dock).toBeVisible({timeout: 15000});
    await expectMarkmapRendered(dock.locator(".markmap-view-svg"));
    return dock;
};

/** 打开插件设置面板（点击顶栏插件菜单中的插件名）。 */
export const openPluginSettings = async (page: Page) => {
    await page.locator("#barPlugins").click();
    const menu = page.locator('.b3-menu[data-name="topBarPlugin"]:not(.fn__none)');
    await expect(menu).toBeVisible();
    await menu.locator(`[data-id="${PLUGIN_NAME}"]`).first().click();
    // SettingUtils 使用 `new Setting()`，面板是一个独立的 b3-dialog，其内含 .b3-label.config-item
    const dialog = page.locator(".b3-dialog__container")
        .filter({has: page.locator(".b3-label.config-item")}).last();
    await expect(dialog.locator(".b3-label.config-item").first()).toBeVisible({timeout: 15000});
    return dialog;
};