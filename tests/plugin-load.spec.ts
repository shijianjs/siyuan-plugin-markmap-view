import {expect, test} from "./fixtures";
import {openWorkspace, PLUGIN_NAME} from "./helpers/runtime";

/**
 * 冒烟用例：确认内核真的加载了插件，并且插件注册的界面元素出现在前端。
 * 这条用例可以在任何 CI 环境中最早暴露「内核没有加载插件」的问题。
 */
test.describe("plugin loading", () => {
    test("the kernel serves the petal and the frontend renders its entries", async ({
        page, siyuanAPI,
    }) => {
        const petals = await siyuanAPI.getLoadedPetals();
        expect(petals, "内核应加载被测插件").toContain(PLUGIN_NAME);

        await openWorkspace(page);

        await expect(page.locator(`.dock__item[data-type$="${PLUGIN_NAME}markmap_dock"]`))
            .toHaveCount(1);
        // 插件图标由 addIcons 注入到全局 svg 精灵图
        await expect(page.locator("#icon-park-outline--mindmap-map")).toHaveCount(1);

        const workspaceInfo = await siyuanAPI.getWorkspaceInfo();
        expect(workspaceInfo.workspaceDir).toBeTruthy();
    });
});