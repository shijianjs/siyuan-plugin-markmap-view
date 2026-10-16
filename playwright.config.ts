import {defineConfig} from "@playwright/test";
import {getBaseURL} from "./tests/helpers/runtime";

export default defineConfig({
    testDir: "./tests",
    testMatch: /.*\.spec\.ts/,
    globalSetup: "./tests/global-setup.ts",
    globalTeardown: "./tests/global-teardown.ts",
    timeout: 60000,
    expect: {timeout: 15000},
    retries: 0,
    // 停靠栏与设置面板属于全局 UI 状态，串行执行更稳定
    workers: 1,
    fullyParallel: false,
    reporter: process.env.CI ? [["list"], ["html", {open: "never"}]] : "list",
    use: {
        baseURL: getBaseURL(),
        headless: true,
        viewport: {width: 1440, height: 900},
        actionTimeout: 10000,
        channel: "chrome",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
});