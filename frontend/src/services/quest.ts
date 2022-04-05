import ServiceBase from "./base";
import serviceHandler from "@/decorators/service-handler";
import JSEncrypt from "jsencrypt";
import { commonSetting } from "@/settings";

export default class QuestService extends ServiceBase {
    public static readonly instance: QuestService = new QuestService();

    @serviceHandler("query", {title: "login", showLoading: false})
    public async login(account: string, password: string, token: string) {
        let encrypt = new JSEncrypt();
        encrypt.setPublicKey(commonSetting.RSAPublicKey);
        let encryptedPwd = encrypt.encrypt(password);
        let data = {account, password: encryptedPwd, token};
        return this._post<any>(`${this.mainServer}/user/login`, data);
    }

    @serviceHandler("query", {title: "create", showLoading: false})
    public async create(nickname: string, character: any) {
        let data = {nickname, character};
        return this._post<any>(`${this.mainServer}/user/create`, data);
    }

    @serviceHandler("query", {title: "userInfo", showLoading: false})
    public async getUserInfo() {
        return this._get<any>(`${this.mainServer}/user/userInfo`);
    }

    @serviceHandler("query", {title: "addPoint", showLoading: false})
    public async addPoint(type: string) {
        return this._post<any>(`${this.mainServer}/user/addPoint`, {type});
    }

    @serviceHandler("query", {title: "getRank", showLoading: false})
    public async getRank(limit: number = 50) {
        return this._get<any>(`${this.mainServer}/user/rank?limit=${limit}`);
    }

    @serviceHandler("query", {title: "getQuests", showLoading: false})
    public async getQuests() {
        return this._get<any>(`${this.mainServer}/user/quests`);
    }

    @serviceHandler("query", {title: "getBossInfo", showLoading: false})
    public async getBossInfo() {
        return this._get<any>(`${this.mainServer}/user/boss`);
    }

    @serviceHandler("query", {title: "getExpList", showLoading: false})
    public async getExpList(limit: number = 10) {
        return this._get<any>(`${this.mainServer}/user/expList?limit=${limit}`);
    }

    @serviceHandler("query", {title: "share", showLoading: false})
    public async share() {
        return this._post<any>(`${this.mainServer}/user/share`);
    }

    @serviceHandler("query", {title: "submit", showLoading: false})
    public async submit(bscAccount: string, email: string) {
        let data = {bsc_account: bscAccount, email};
        return this._post<any>(`${this.mainServer}/user/submit`, data);
    }
}
