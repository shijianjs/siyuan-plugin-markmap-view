import {APIRequestContext} from "@playwright/test";

export interface ISiyuanResponse<T> {
    code: number;
    msg: string;
    data: T;
}

export interface IWorkspaceInfo {
    workspaceDir: string;
    siyuanVer: string;
}

export interface INotebook {
    id: string;
    name: string;
    closed: boolean;
}

/** 集市相关配置，petalDisabled 为全局插件开关。 */
export interface IBazaarConf {
    trust?: boolean;
    petalDisabled?: boolean;
    [key: string]: unknown;
}

export interface IDocumentEntry {
    id: string;
    name: string;
    path: string;
    subFileCount: number;
}

export interface IDocumentContent {
    id: string;
    rootID: string;
    content: string;
    box: string;
    path: string;
}

/** 思源内核 HTTP 客户端，只封装插件测试需要的接口。 */
export class SiyuanAPI {
    private readonly request: APIRequestContext;
    private readonly baseURL: string;

    constructor(request: APIRequestContext, baseURL: string) {
        this.request = request;
        this.baseURL = baseURL;
    }

    private resolve(path: string) {
        return new URL(path, this.baseURL).toString();
    }

    async postResult<T>(path: string, data: object, timeout?: number): Promise<ISiyuanResponse<T>> {
        const response = await this.request.post(this.resolve(path), {data, timeout});
        if (!response.ok()) {
            throw new Error(`${path} returned HTTP ${response.status()}: ${await response.text()}`);
        }
        return response.json() as Promise<ISiyuanResponse<T>>;
    }

    async post<T>(path: string, data: object, timeout?: number): Promise<T> {
        const result = await this.postResult<T>(path, data, timeout);
        if (result.code !== 0) {
            throw new Error(`${path} failed with code ${result.code}: ${result.msg}`);
        }
        return result.data;
    }

    async getWorkspaceInfo() {
        return this.post<IWorkspaceInfo>("/api/system/getWorkspaceInfo", {});
    }

    /** 读取全局配置（这里只用到集市相关字段）。 */
    async getBazaarConf() {
        const data = await this.post<{conf: {bazaar: IBazaarConf}}>("/api/system/getConf", {});
        return data.conf.bazaar;
    }

    /** 写入全局配置；必须带上完整字段。 */
    async setBazaarConf(bazaar: IBazaarConf) {
        await this.post<IBazaarConf>("/api/setting/setBazaar", {...bazaar, app: "markmap-plugin-e2e"});
    }

    async listNotebooks() {
        const data = await this.post<{notebooks: INotebook[]}>("/api/notebook/lsNotebooks", {});
        return data.notebooks;
    }

    async createNotebook(name: string) {
        const data = await this.post<{notebook: INotebook}>("/api/notebook/createNotebook", {name});
        return data.notebook;
    }

    async openNotebook(notebook: string) {
        await this.post<null>("/api/notebook/openNotebook", {notebook}, 30000);
    }

    async removeNotebook(notebook: string) {
        await this.post<null>("/api/notebook/removeNotebook", {notebook});
    }

    async listDocuments(notebook: string, path = "/") {
        const data = await this.post<{files: IDocumentEntry[]}>("/api/filetree/listDocsByPath", {
            notebook,
            path,
            maxListCount: 0,
        }, 30000);
        return data.files;
    }

    async listAllDocuments(notebook: string) {
        const directories = ["/"];
        const visited = new Set<string>();
        const documents = new Map<string, IDocumentEntry>();
        while (directories.length > 0) {
            const directory = directories.shift()!;
            if (visited.has(directory)) {
                continue;
            }
            visited.add(directory);
            for (const document of await this.listDocuments(notebook, directory)) {
                documents.set(document.id, document);
                if (document.subFileCount > 0) {
                    directories.push(document.path);
                }
            }
        }
        return [...documents.values()];
    }

    async createDocument(notebook: string, title: string, markdown = "") {
        return this.post<string>("/api/filetree/createDocWithMd", {
            notebook,
            path: `/${title}`,
            markdown,
        }, 30000);
    }

    async removeDocument(id: string) {
        await this.post<null>("/api/filetree/removeDocByID", {id});
    }

    async getDocumentContent(id: string) {
        const endpoint = "/api/filetree/getDoc";
        const deadline = Date.now() + 15000;
        while (true) {
            const result = await this.postResult<IDocumentContent>(endpoint, {
                id,
                highlight: false,
            });
            if (result.code === 0) {
                return result.data;
            }
            if (result.msg !== "indexing" || Date.now() >= deadline) {
                throw new Error(`${endpoint} failed with code ${result.code}: ${result.msg}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async exportMdContent(id: string) {
        return this.post<{content: string}>("/api/export/exportMdContent", {id});
    }

    async flushTransactions() {
        await this.post<null>("/api/sqlite/flushTransaction", {}, 30000);
    }

    /**
     * 读取工作空间文件。文件不存在时返回 undefined，避免用例把“尚未保存”当成失败。
     * 注意：getFile 成功时直接返回文件内容（不是思源的 {code,msg,data} 包装）。
     */
    async readWorkspaceTextIfExists(path: string) {
        const response = await this.request.post(this.resolve("/api/file/getFile"), {data: {path}});
        if (response.ok()) {
            return await response.text();
        }
        return undefined;
    }

    /** 写入工作空间文件（覆盖已有内容）。 */
    async writeWorkspaceFile(directory: string, name: string, content: string) {
        const endpoint = "/api/file/putFile";
        const response = await this.request.post(this.resolve(endpoint), {
            multipart: {
                "files[]": {buffer: Buffer.from(content, "utf-8"), mimeType: "application/json", name},
                isDir: "false",
                path: directory,
            },
        });
        if (!response.ok()) {
            throw new Error(`${endpoint} returned HTTP ${response.status()}: ${await response.text()}`);
        }
        const result = await response.json() as ISiyuanResponse<null>;
        if (result.code !== 0) {
            throw new Error(`${endpoint} failed with code ${result.code}: ${result.msg}`);
        }
    }

    /** 读取指定插件是否启用（getInstalledPlugin 需要 frontend 参数）。 */
    async getInstalledPlugin(packageName: string, frontend = "desktop") {
        const data = await this.post<{
            packages?: Array<{name: string; enabled: boolean}>;
        } | string>("/api/bazaar/getInstalledPlugin", {frontend}, 30000);
        // 兼容 data 直接为列表或 {packages: [...]} 的返回形式
        const raw = typeof data === "string" ? JSON.parse(data) : data;
        const packages = (Array.isArray(raw) ? raw : raw?.packages) ?? [];
        return packages.find((plugin: {name: string}) => plugin.name === packageName);
    }

    /** 读取内核当前已加载的前端插件名。 */
    async getLoadedPetals(frontend = "browser-desktop") {
        const data = await this.post<Array<{name: string}> | null>("/api/petal/loadPetals", {frontend}, 30000);
        return Array.isArray(data) ? data.map(petal => petal.name) : [];
    }

    /** 启用/禁用插件，返回是否执行了变更。 */
    async setPluginEnabled(packageName: string, enabled: boolean, frontend = "desktop") {
        await this.post<unknown>("/api/petal/setPetalEnabled", {
            packageName,
            enabled,
            frontend,
            app: "markmap-plugin-e2e",
        }, 30000);
        const plugin = await this.getInstalledPlugin(packageName, frontend);
        if (plugin && plugin.enabled !== enabled) {
            throw new Error(`${packageName} 未切换到 enabled=${enabled}`);
        }
        return plugin;
    }
}