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
    page: async ({page}, use, testInfo) => {
        const messages: string[] = [];
        page.on("console", message => {
            if (message.type() === "error" || message.type() === "warning") {
                messages.push(`[console.${message.type()}] ${message.text()}`);
            }
        });
        page.on("pageerror", error => messages.push(`[pageerror] ${error.message}`));
        page.on("requestfailed", request => {
            messages.push(`[requestfailed] ${request.url()} ${request.failure()?.errorText ?? ""}`);
        });
        await use(page);
        if (testInfo.status !== testInfo.expectedStatus && messages.length > 0) {
            // 打印浏览器侧日志，CI 里可以直接从运行日志定位插件加载问题
            console.log(`[page diagnostics] ${messages.slice(0, 40).join("\n")}`);
        }
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