import {expect, test} from "./fixtures";
import {getMarkmapDock, MARKDOWN_SAMPLE, readMarkmapNodes} from "./helpers/plugin";
import {showMarkmapDock} from "./helpers/runtime";

test.describe("markmap dock", () => {
    test("renders the current document in the dock", async ({createTestDocument, page}) => {
        const {title} = await createTestDocument("markmap-dock", MARKDOWN_SAMPLE);

        const restoreDock = await showMarkmapDock(page, "markmap_dock");
        try {
            const dock = await getMarkmapDock(page);
            const nodes = await readMarkmapNodes(dock);
            expect(nodes).toContain(title);
            expect(nodes).toContain("Branch Alpha");
        } finally {
            await restoreDock();
        }
    });

    test("re-renders the map after clicking refresh", async ({createTestDocument, page}) => {
        await createTestDocument("markmap-dock-refresh", MARKDOWN_SAMPLE);

        const restoreDock = await showMarkmapDock(page, "markmap_dock");
        try {
            const dock = await getMarkmapDock(page);
            const refresh = dock.locator('.block__icons [data-type="refresh"]');
            await expect(refresh).toBeVisible();

            const svg = dock.locator(".markmap-view-svg");
            const nodesBefore = await readMarkmapNodes(svg);
            expect(nodesBefore.length).toBeGreaterThan(0);

            await refresh.click();
            await expect.poll(async () => (await readMarkmapNodes(svg)).length >= nodesBefore.length,
                {timeout: 15000}).toBe(true);
            // 刷新会重建 markmap，不应该残留上一轮的节点
            await expect.poll(async () => (await readMarkmapNodes(svg)).length,
                {timeout: 15000}).toBe(nodesBefore.length);
        } finally {
            await restoreDock();
        }
    });
});