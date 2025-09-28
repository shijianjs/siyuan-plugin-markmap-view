import { Client } from "@siyuan-community/siyuan-sdk";

/* 初始化客户端 (默认使用 Axios 发起 XHR 请求) */
export const client = new Client({
    /**
     * (可选) 思源内核服务地址
     * @default: document.baseURI
     */
    // baseURL: "http://localhost:6806/",

    /**
     * (可选) 思源内核服务 token
     * @default: <空>
     */
    // token: "0123456789abcdef", // , 默认为空

    /**
     * (可选) Axios 其他请求配置
     * REF: https://axios-http.com/zh/docs/req_config
     * REF: https://www.axios-http.cn/docs/req_config
     */
});