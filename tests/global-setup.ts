import {request} from "@playwright/test";
import fs from "node:fs";
import {getBaseURL, PLUGIN_NAME, validateTestTarget} from "./helpers/runtime";
import {SiyuanAPI} from "./helpers/siyuanAPI";
import {ensureTestNotebook} from "./testNotebook";

const STATE_FILE = "tests/.plugin-state.json";

/** 运行测试前校验内核、准备笔记本，并确保被测插件处于启用状态。 */
export default async function globalSetup() {
    const baseURL = getBaseURL();
    const context = await request.newContext({baseURL});
    try {
        const api = new SiyuanAPI(context, baseURL);
        await validateTestTarget(api, baseURL);
        await ensureTestNotebook(api);

        const plugin = await api.getInstalledPlugin(PLUGIN_NAME);
        if (!plugin) {
            throw new Error(`插件 ${PLUGIN_NAME} 未安装到测试工作空间，请先执行 pnpm make-link 并重启内核。`);
        }
        if (!plugin.enabled) {
            await api.setPluginEnabled(PLUGIN_NAME, true);
            fs.writeFileSync(STATE_FILE, JSON.stringify({enabled: false, changed: true}));
            console.log(`[markmap-e2e] 已临时启用插件 ${PLUGIN_NAME}`);
        } else {
            fs.writeFileSync(STATE_FILE, JSON.stringify({enabled: true, changed: false}));
        }
    } finally {
        await context.dispose();
    }
}