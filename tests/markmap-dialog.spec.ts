import {expect, test} from "./fixtures";
import {MARKDOWN_SAMPLE, openMarkmapDialog, readMarkmapNodes} from "./helpers/plugin";

test.describe("markmap dialog", () => {
    test("opens mind map through the registered hotkey", async ({createTestDocument, closeDialogs, page}) => {
        const {title} = await createTestDocument("markmap-dialog", MARKDOWN_SAMPLE);

        const dialog = await openMarkmapDialog(page);
        await expect(dialog).toContainText(`Markmap - ${title}`);

        const nodes = await readMarkmapNodes(dialog);
        expect(nodes).toContain(title);
        expect(nodes).toContain("Branch Alpha");
        expect(nodes).toContain("Branch Beta");

        await closeDialogs();
    });

    test("renders the markmap toolbar with the export button", async ({createTestDocument, closeDialogs, page}) => {
        await createTestDocument("markmap-toolbar", MARKDOWN_SAMPLE);

        const dialog = await openMarkmapDialog(page);
        const toolbar = dialog.locator(".markmap-view-container .mm-toolbar");
        await expect(toolbar).toBeVisible();
        const items = toolbar.locator(".mm-toolbar-item");
        await expect(items.first()).toBeVisible();
        // built-in zoom buttons plus the plugin's own export button
        expect(await items.count()).toBeGreaterThan(1);
        expect(await items.evaluateAll(elements =>
            elements.map(element => (element as HTMLElement).title).filter(Boolean))).not.toHaveLength(0);

        await closeDialogs();
    });
});
