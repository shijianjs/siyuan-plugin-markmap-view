import fs from "node:fs";
import {request} from "@playwright/test";
import {getBaseURL, PLUGIN_NAME} from "./helpers/runtime";
import {SiyuanAPI} from "./helpers/siyuanAPI";

const STATE_FILE = "tests/.plugin-state.json";

interface ISetupState {
    pluginEnabled: boolean;
    pluginStateChanged: boolean;
    bazaarConf?: Record<string, unknown>;
    bazaarChanged: boolean;
}

/** 恢复 global-setup 中临时改动的插件启用状态与全局插件开关。 */
export default async function globalTeardown() {
    if (!fs.existsSync(STATE_FILE)) {
        return;
    }
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as ISetupState;
    fs.rmSync(STATE_FILE, {force: true});
    if (!state.pluginStateChanged && !state.bazaarChanged) {
        return;
    }

    const baseURL = getBaseURL();
    const context = await request.newContext({baseURL});
    try {
        const api = new SiyuanAPI(context, baseURL);
        if (state.pluginStateChanged) {
            await api.setPluginEnabled(PLUGIN_NAME, state.pluginEnabled);
            console.log(`[markmap-e2e] 已恢复插件 ${PLUGIN_NAME} 的启用状态：${state.pluginEnabled}`);
        }
        if (state.bazaarChanged && state.bazaarConf) {
            await api.setBazaarConf(state.bazaarConf);
            console.log("[markmap-e2e] 已恢复全局插件开关配置");
        }
    } finally {
        await context.dispose();
    }
}