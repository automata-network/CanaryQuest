export const global = <any>window;
let debug = process.env.NODE_ENV === "development";

// 公共配置
export let commonSetting = {
    ...{
        // 后端地址
        mock: false,
        baseUrl: debug ? "http://localhost:4000" : "http://localhost:4000",
        mainServer: "",
        RSAPublicKey: "",
        reCaptchaSiteKey: ""
    },
    ...global.commonSetting
};

// keep-alive缓存页面列表
export const cachePageList = [];
