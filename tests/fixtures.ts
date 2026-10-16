import {test as base} from "@playwright/test";
import {SiyuanAPI} from "./helpers/siyuanAPI";
import {closePluginDialogs} from "./helpers/runtime";
import {
    createTestDocument,
    preserveFailedTestDocuments,
    removeCreatedTestDocuments,
    TestDocumentFactory,
} from "./testNotebook";

interface ITestFixtures {
    siyuanAPI: SiyuanAPI;
    createTestDocument: TestDocumentFactory;
    createdTestDocuments: Array<{id: string; notebookID: string; title: string}>;
    closeDialogs: () => Promise<void>;
    testDocumentCleanup: void;
}

export const test = base.extend<ITestFixtures>({
    siyuanAPI: async ({request, baseURL}, use) => {
        if (!baseURL) {
            throw new Error("playwright.config.ts must define use.baseURL");
        }
        await use(new SiyuanAPI(request, baseURL));
    },
    createdTestDocuments: async ({}, use) => {
        await use([]);
    },
    createTestDocument: async ({page, siyuanAPI, createdTestDocuments}, use) => {
        await use((titlePrefix, markdown) =>
            createTestDocument(page, siyuanAPI, createdTestDocuments, titlePrefix, markdown));
    },
    closeDialogs: async ({page}, use) => {
        await closePluginDialogs(page);
        await use(async () => closePluginDialogs(page));
    },
    testDocumentCleanup: [async ({page, siyuanAPI, createdTestDocuments}, use, testInfo) => {
        await use();
        if (testInfo.status === "passed") {
            await removeCreatedTestDocuments(page, siyuanAPI, createdTestDocuments);
        } else {
            await preserveFailedTestDocuments(createdTestDocuments, testInfo);
        }
    }, {auto: true}],
});

export {expect} from "@playwright/test";