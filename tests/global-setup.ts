import {request} from "@playwright/test";
import fs from "node:fs";
import {getBaseURL, PLUGIN_NAME, validateTestTarget} from "./helpers/runtime";
import {IBazaarConf, SiyuanAPI} from "./helpers/siyuanAPI";
import {ensureTestNotebook} from "./testNotebook";

const STATE_FILE = "tests/.plugin-state.json";

interface ISetupState {
    pluginEnabled: boolean;
    pluginStateChanged: boolean;
    bazaarConf?: IBazaarConf;
    bazaarChanged: boolean;
}

/** 运行测试前校验内核、准备笔记本，并确保插件与全局插件开关都处于可用状态。 */
export default async function globalSetup() {
    const baseURL = getBaseURL();
    const context = await request.newContext({baseURL});
    try {
        const api = new SiyuanAPI(context, baseURL);
        await validateTestTarget(api, baseURL);
        await ensureTestNotebook(api);

        const state: ISetupState = {
            pluginEnabled: true,
            pluginStateChanged: false,
            bazaarChanged: false,
        };

        // A fresh workspace has trust=false, and the kernel refuses to load petals until the user
// confirms the marketplace trust. petalDisabled is the global plugin switch.
        const bazaar = await api.getBazaarConf();
        if (bazaar.petalDisabled !== false || bazaar.trust !== true) {
            state.bazaarConf = bazaar;
            await api.setBazaarConf({...bazaar, petalDisabled: false, trust: true});
            state.bazaarChanged = true;
            console.log("[markmap-e2e] 已临时打开集市信任与全局插件开关");
        }

        const plugin = await api.getInstalledPlugin(PLUGIN_NAME);
        if (!plugin) {
            throw new Error(`插件 ${PLUGIN_NAME} 未安装到测试工作空间，请先执行 pnpm make-link 并重启内核。`);
        }
        state.pluginEnabled = Boolean(plugin.enabled);
        if (!plugin.enabled) {
            await api.setPluginEnabled(PLUGIN_NAME, true);
            state.pluginStateChanged = true;
            console.log(`[markmap-e2e] 已临时启用插件 ${PLUGIN_NAME}`);
        }

        const loaded = await api.getLoadedPetals();
        if (!loaded.includes(PLUGIN_NAME)) {
            throw new Error(
                `内核未加载插件 ${PLUGIN_NAME}，已加载：${loaded.join(", ") || "（空）"}。`,
            );
        }

        fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    } finally {
        await context.dispose();
    }
}