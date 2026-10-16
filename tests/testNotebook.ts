import {Locator, Page, TestInfo} from "@playwright/test";
import {SiyuanAPI} from "./helpers/siyuanAPI";
import {openWorkspace} from "./helpers/runtime";
import {getDocumentEditor} from "./helpers/plugin";

export const TEST_NOTEBOOK_NAME = "Markmap E2E Testing";

export interface ITestDocument {
    docID: string;
    editor: Locator;
    notebookID: string;
    title: string;
}

interface ICreatedTestDocument {
    id: string;
    notebookID: string;
    title: string;
}

export type TestDocumentFactory = (titlePrefix: string, markdown?: string) => Promise<ITestDocument>;

export const ensureTestNotebook = async (api: SiyuanAPI) => {
    const notebooks = await api.listNotebooks();
    let notebook = notebooks.find(item => item.name === TEST_NOTEBOOK_NAME);
    if (!notebook) {
        notebook = await api.createNotebook(TEST_NOTEBOOK_NAME);
    } else if (notebook.closed) {
        await api.openNotebook(notebook.id);
    }
    return notebook.id;
};

export const createTestDocument = async (page: Page, api: SiyuanAPI,
                                         created: ICreatedTestDocument[], titlePrefix: string,
                                         markdown = "") => {
    const notebookID = await ensureTestNotebook(api);
    const title = `${titlePrefix} ${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const docID = await api.createDocument(notebookID, title, markdown);
    created.push({id: docID, notebookID, title});
    await openWorkspace(page, `/?id=${docID}`);
    const editor = await getDocumentEditor(page, docID);
    return {docID, editor, notebookID, title};
};

export const removeCreatedTestDocuments = async (page: Page, api: SiyuanAPI,
                                                  documents: ICreatedTestDocument[]) => {
    if (documents.length === 0) {
        return;
    }
    if (!page.isClosed()) {
        await page.goto("about:blank");
    }
    await api.flushTransactions();
    for (const document of documents) {
        let absentSince = 0;
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
            const exists = (await api.listAllDocuments(document.notebookID)).some(item => item.id === document.id);
            if (!exists) {
                absentSince = absentSince === 0 ? Date.now() : absentSince;
                if (Date.now() - absentSince >= 1000) {
                    break;
                }
            } else {
                absentSince = 0;
                await api.removeDocument(document.id);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
};

export const preserveFailedTestDocuments = async (documents: ICreatedTestDocument[], testInfo: TestInfo) => {
    if (documents.length === 0) {
        return;
    }
    await testInfo.attach("preserved-test-documents", {
        body: Buffer.from(JSON.stringify(documents, null, 2)),
        contentType: "application/json",
    });
};