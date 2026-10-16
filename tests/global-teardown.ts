import fs from "node:fs";
import {request} from "@playwright/test";
import {getBaseURL, PLUGIN_NAME} from "./helpers/runtime";
import {SiyuanAPI} from "./helpers/siyuanAPI";

const STATE_FILE = "tests/.plugin-state.json";

/** 恢复 global-setup 中临时改动的插件启用状态。 */
export default async function globalTeardown() {
    if (!fs.existsSync(STATE_FILE)) {
        return;
    }
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as {enabled: boolean; changed: boolean};
    fs.rmSync(STATE_FILE, {force: true});
    if (!state.changed) {
        return;
    }
    const baseURL = getBaseURL();
    const context = await request.newContext({baseURL});
    try {
        await new SiyuanAPI(context, baseURL).setPluginEnabled(PLUGIN_NAME, state.enabled);
        console.log(`[markmap-e2e] 已恢复插件 ${PLUGIN_NAME} 的启用状态：${state.enabled}`);
    } finally {
        await context.dispose();
    }
}