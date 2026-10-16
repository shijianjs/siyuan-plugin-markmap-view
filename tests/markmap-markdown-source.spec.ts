import {expect, test} from "./fixtures";
import {
    MARKDOWN_SAMPLE, openMarkmapDialog, openPluginSettings, readMarkmapNodes,
} from "./helpers/plugin";
import {readPluginSettings, settingRow, withSetting} from "./helpers/settings";

test.describe("markmap rendering options", () => {
    test("document frontmatter markmap options override the saved settings", async ({
        closeDialogs, createTestDocument, page, siyuanAPI,
    }) => {
        const {title} = await createTestDocument("markmap-frontmatter",
            `---\nmarkmap:\n  initialExpandLevel: 1\n---\n\n${MARKDOWN_SAMPLE}`);

        // 先把全局展开层级固定为 4，确保断言只反映 frontmatter 的影响
        const restore = await withSetting(page, siyuanAPI, "initialExpandLevel", 4);
        try {
            const dialog = await openMarkmapDialog(page);
            const nodes = await readMarkmapNodes(dialog);
            // initialExpandLevel: 1 只渲染根节点，分支内容全部折叠
            expect(nodes).toEqual([title]);
            expect(nodes).not.toContain("Branch Alpha");
            await closeDialogs();
        } finally {
            await restore();
        }
    });

    test("documents without frontmatter follow the saved settings", async ({
        closeDialogs, createTestDocument, page, siyuanAPI,
    }) => {
        await createTestDocument("markmap-no-frontmatter", MARKDOWN_SAMPLE);

        const restore = await withSetting(page, siyuanAPI, "initialExpandLevel", 4);
        try {
            const dialog = await openMarkmapDialog(page);
            const nodes = await readMarkmapNodes(dialog);
            expect(nodes).toContain("Branch Alpha");
            expect(nodes).toContain("alpha item one");
            expect(nodes).toContain("Beta Child");
            await closeDialogs();
        } finally {
            await restore();
        }
    });

    test("getDoc mode renders the mind map from the page content", async ({
        closeDialogs, createTestDocument, page, siyuanAPI,
    }) => {
        await createTestDocument("markmap-mode-getdoc", MARKDOWN_SAMPLE);

        const restore = await withSetting(page, siyuanAPI, "markdownSourceMode", "getDoc");
        try {
            // 设置在插件加载时读取，需要重新加载页面
            await page.reload();
            const dialog = await openMarkmapDialog(page);
            const nodes = await readMarkmapNodes(dialog);
            expect(nodes.some(node => node.includes("Branch Alpha"))).toBe(true);
            await closeDialogs();
        } finally {
            await restore();
        }
    });
});