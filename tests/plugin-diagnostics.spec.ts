import {expect, test} from "@playwright/test";
import {openWorkspace, PLUGIN_NAME} from "./helpers/runtime";
import {test as fixture} from "./fixtures";

/**
 * 诊断用例：打印内核/前端识别到的插件信息与浏览器日志，
 * 用于在 CI 上定位「插件已安装但界面未出现」这类问题。
 */
fixture("plugin diagnostics", async ({page, siyuanAPI}) => {
    const logs: string[] = [];
    page.on("console", message => logs.push(`[${message.type()}] ${message.text()}`));
    page.on("pageerror", error => logs.push(`[pageerror] ${error.message}`));
    page.on("requestfailed", request =>
        logs.push(`[requestfailed] ${request.url()} ${request.failure()?.errorText ?? ""}`));

    await openWorkspace(page);
    await page.locator("#barPlugins").click();
    await page.waitForTimeout(2000);
    const state = await page.evaluate(async () => {
        const response = await fetch("/api/petal/loadPetals", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({frontend: "browser-desktop"}),
        });
        const petals = await response.json();
        return {
            hasIpcRenderer: typeof (window as never as {ipcRenderer?: unknown}).ipcRenderer,
            hasRequire: typeof (window as never as {require?: unknown}).require,
            userAgent: navigator.userAgent,
            url: location.href,
            remoteQuery: location.search,
            petalNames: Array.isArray(petals.data) ? petals.data.map(item => item.name) : petals,
            container: window.siyuan.config.system.container,
            petalDisabled: (window.siyuan.config.bazaar as {petalDisabled?: boolean} | undefined)?.petalDisabled,
            dockTypes: [...document.querySelectorAll(".dock__item[data-type]")]
                .map(element => (element as HTMLElement).dataset.type),
            menuIds: [...document.querySelectorAll('.b3-menu[data-name="topBarPlugin"] [data-id]')]
                .map(element => (element as HTMLElement).dataset.id),
            pluginStyles: [...document.querySelectorAll('[id^="pluginsStyle"]')].map(element => element.id),
        };
    });
    console.log("DIAG " + JSON.stringify(state));
    console.log("LOGS " + logs.slice(-60).join("\n"));
    const installed = await siyuanAPI.getInstalledPlugin(PLUGIN_NAME);
    console.log("INSTALLED enabled=" + String(installed?.enabled));
    expect(state.dockTypes.length).toBeGreaterThan(0);
});