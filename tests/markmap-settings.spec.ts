import {expect, test} from "./fixtures";
import {MARKDOWN_SAMPLE, openMarkmapDialog, openPluginSettings, readMarkmapNodes} from "./helpers/plugin";
import {readPluginSettings, savePluginSettingsDialog, settingRow, withSetting} from "./helpers/settings";

/** 插件内置默认值，用于在工作空间尚未保存设置时比对面板取值。 */
const PLUGIN_DEFAULTS: Record<string, string | number | boolean> = {
    markdownSourceMode: "exportMdContent",
    duration: 500,
    initialExpandLevel: 4,
    spacingHorizontal: 80,
    spacingVertical: 5,
    zoom: true,
    pan: true,
};

test.describe("plugin settings", () => {
    test("shows every core markmap option with its effective value", async ({
        createTestDocument, closeDialogs, page, siyuanAPI,
    }) => {
        await createTestDocument("markmap-settings-panel", MARKDOWN_SAMPLE);
        const saved = await readPluginSettings(siyuanAPI);

        const dialog = await openPluginSettings(page);
        for (const key of ["markdownSourceMode", "duration", "initialExpandLevel",
            "spacingHorizontal", "spacingVertical"] as const) {
            const expected = String(saved[key] ?? PLUGIN_DEFAULTS[key]);
            await expect((await settingRow(page, dialog, key)).locator("select, input").first())
                .toHaveValue(expected);
        }
        for (const key of ["zoom", "pan"] as const) {
            const expected = saved[key] ?? PLUGIN_DEFAULTS[key];
            await expect((await settingRow(page, dialog, key)).locator("input[type='checkbox']").first())
                .toBeChecked({checked: Boolean(expected)});
        }

        await closeDialogs();
    });

    test("markdown source mode offers both kernel sources", async ({createTestDocument, closeDialogs, page}) => {
        await createTestDocument("markmap-settings-modes", MARKDOWN_SAMPLE);

        const dialog = await openPluginSettings(page);
        const options = (await settingRow(page, dialog, "markdownSourceMode")).locator("select option");
        await expect(options).toHaveCount(2);
        expect(await options.evaluateAll(elements =>
            elements.map(element => (element as HTMLOptionElement).value))).toEqual(
            ["exportMdContent", "getDoc"]);

        await closeDialogs();
    });

    test("saving the panel persists the value and applies it when rendering", async ({
        closeDialogs, createTestDocument, page, siyuanAPI,
    }) => {
        await createTestDocument("markmap-settings-save", MARKDOWN_SAMPLE);

        const restore = await withSetting(page, siyuanAPI, "initialExpandLevel", 1);
        try {
            await expect.poll(async () => (await readPluginSettings(siyuanAPI)).initialExpandLevel,
                {timeout: 10000}).toBe(1);

            // 设置在重新渲染时生效：只保留根节点
            const markmapDialog = await openMarkmapDialog(page);
            const nodes = await readMarkmapNodes(markmapDialog);
            expect(nodes.some(node => node.includes("alpha item one"))).toBe(false);
            await closeDialogs();
        } finally {
            await restore();
        }
    });

    test("cancelling the panel keeps the saved value", async ({
        createTestDocument, closeDialogs, page, siyuanAPI,
    }) => {
        await createTestDocument("markmap-settings-cancel", MARKDOWN_SAMPLE);
        const before = await readPluginSettings(siyuanAPI);

        const dialog = await openPluginSettings(page);
        const input = (await settingRow(page, dialog, "initialExpandLevel"))
            .locator("input[type='number']").first();
        const original = await input.inputValue();
        await input.fill(original === "2" ? "3" : "2");
        await dialog.locator(".b3-dialog__action .b3-button--cancel").click();
        await expect(dialog).toHaveCount(0);

        expect(await readPluginSettings(siyuanAPI)).toEqual(before);
        await closeDialogs();
    });
});