import {test} from "./fixtures";
import {openWorkspace, PLUGIN_NAME} from "./helpers/runtime";
import {expect} from "@playwright/test";

/** 诊断用例：打印内核/前端识别到的插件信息，便于在 CI 上定位插件未加载的原因。 */
test("plugin diagnostics", async ({page, siyuanAPI}) => {
    await openWorkspace(page);
    await page.locator("#barPlugins").click();
    await page.waitForTimeout(2000);
    const state = await page.evaluate(pluginName => ({
        system: window.siyuan.config.system,
        dockTypes: [...document.querySelectorAll(".dock__item[data-type]")]
            .map(e => (e as HTMLElement).dataset.type),
        menuIds: [...document.querySelectorAll('.b3-menu[data-name="topBarPlugin"] [data-id]')]
            .map(e => (e as HTMLElement).dataset.id),
        pluginGlobal: (window as never as {siyuan: {config: {plugins?: unknown}}}).siyuan.config.plugins,
        iconPresent: !!document.querySelector(`#${pluginName}`),
    }), PLUGIN_NAME);
    console.log("DIAG", JSON.stringify(state, null, 1));
    const installed = await siyuanAPI.getInstalledPlugin(PLUGIN_NAME);
    console.log("INSTALLED", JSON.stringify(installed));
    expect(state.system).toBeTruthy();
});