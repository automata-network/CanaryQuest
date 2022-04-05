import axios from "axios";
import bcrypt from "bcrypt";
import config from "config";
import NodeRSA from "node-rsa";
import jwt from "jsonwebtoken";
import HttpStatusCodes from "http-status-codes";
import { Router, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { currentQuest, proposalAttackCount } from "../activities/register";

import User, { IUser } from "../models/User";
import Exp, { IExp } from "../models/Exp";
import Task from "../models/Task";
import Boss from "../models/Boss";
import { addExp, getAttackerData } from "../activities/handlers/common";
import { logger } from "../logger";

const router: Router = Router();
const FormData = require("form-data");
const characterInitData = require("../../config/characters.json");

let winners = require("../../config/quest_winners.json");
winners = winners.map((s: string) => s.toLowerCase());

router.post(
    "/login",
    [
        check("account", "Account shouldn't be empty").notEmpty(),
        check("password", "Password shouldn't be empty").notEmpty(),
        check("token", "reCaptcha token shouldn't be empty").notEmpty(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({errors: errors.array()});
        }

        try {
            let {account, password, token} = req.body;
            account = account.toLowerCase();
            let resData: any = {}

            // Verify reCaptcha token
            let data = new FormData();
            data.append("secret", config.get("RECAPTCHA_TOKEN"));
            data.append("response", token);
            let result = await axios.post("https://www.recaptcha.net/recaptcha/api/siteverify", data, {
                headers: {
                    ...data.getHeaders()
                },
            });
            if (!result?.data?.success) {
                return res.json({
                    hasError: true,
                    message: "reCaptcha failed, please try again later.",
                    data: {verify: false}
                });
            }
            resData.verify = true;

            // decrypt password and check
            let decrypt = new NodeRSA(config.get("RSA_PRIVATE_KEY"), "pkcs1");
            decrypt.setOptions({encryptionScheme: "pkcs1"});
            let decryptedPwd = decrypt.decrypt(password).toString("utf-8");

            const user = await User.findOne({where: {account}});
            if (user) {
                resData.newbie = user.nickname === "";
                resData.checked = bcrypt.compareSync(decryptedPwd, user.password);
            } else {
                resData.newbie = true;
                resData.checked = true;
                const hash = bcrypt.hashSync(decryptedPwd, 10);
                await User.create({account, password: hash});
            }
            if (!resData.checked) {
                return res.json({hasError: true, message: "Wrong password, please try again.", data: resData});
            }

            // generate JWT
            const signKey: string = config.get("TOKEN_SIGN_KEY");
            resData.access_token = jwt.sign({account}, signKey, {expiresIn: "7d"});
            res.json({hasError: false, message: "", data: resData});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.post(
    "/create",
    [
        check("nickname", "Nickname shouldn't be empty").notEmpty(),
        check("character", "Character shouldn't be empty").notEmpty()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({errors: errors.array()});
        }

        let account = (req.user as any).account;
        const {nickname, character} = req.body;
        try {
            await User.update({
                nickname,
                character,
                strength: characterInitData[character].strength,
                intellect: characterInitData[character].intellect,
                dexterity: characterInitData[character].dexterity,
                mp: parseInt(config.get("MP_LIMIT_DAILY")) + characterInitData[character].intellect
            }, {where: {account}});
            return res.json({hasError: false, message: "", data: {}});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.get(
    "/userInfo",
    [],
    async (req: Request, res: Response) => {
        let account = (req.user as any).account;
        try {
            const user = await User.findOne({where: {account}, raw: true});
            if (!user || user.nickname === "" || user.character === 0) {
                return res.status(HttpStatusCodes.UNAUTHORIZED).send("invalid token");
            }
            let data = {
                ...user,
                mpLimitDaily: config.get("MP_LIMIT_DAILY"),
                remainPoints: user.level + characterInitData.initPoints - (user.strength + user.intellect + user.dexterity),
                winner: winners.includes(account),
                remark: user.remark
            };
            delete data.password;
            return res.json({hasError: false, message: "", data});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.post(
    "/addPoint",
    [
        check("type", "Invalid type").isIn(["strength", "intellect", "dexterity"])
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({errors: errors.array()});
        }

        let account = (req.user as any).account;
        const type: "strength" | "intellect" | "dexterity" = req.body.type;
        try {
            const user = await User.findOne({where: {account}});
            if (type === "dexterity") {
                const limit = Math.trunc(1 / parseFloat(config.get("CRITICAL_CHANCE_PER_DEX")));
                if (user.dexterity + 1 > limit) {
                    return res.json({hasError: true, message: "Dexterity has reached the maximum value", data: {}});
                }
            }
            let remainPoints = user.level + characterInitData.initPoints - (user.strength + user.intellect + user.dexterity);
            if (remainPoints) {
                await User.update({[type]: user[type] + 1}, {where: {account}});
                if (type === "intellect") {
                    await User.update({mp: user.mp + 1}, {where: {account}});
                }
            } else {
                return res.json({hasError: true, message: "No points remaining", data: {}});
            }
            return res.json({hasError: false, message: "", data: {}});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.get(
    "/rank",
    [
        check("limit", "Limit can only be integer").isInt()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({errors: errors.array()});
        }

        const limit = parseInt(req.query.limit as string);
        try {
            let rank: IUser[] = await User.findAll({
                limit,
                order: [
                    ["totalXp", "DESC"]
                ]
            });
            let data = rank.map(item => {
                return {
                    account: item.account,
                    name: item.nickname,
                    level: item.level,
                    exp: item.totalXp,
                    character: item.character
                }
            });
            return res.json({hasError: false, message: "", data});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.get(
    "/quests",
    [],
    async (req: Request, res: Response) => {
        let account = (req.user as any).account;
        try {
            let quests = JSON.parse(JSON.stringify(currentQuest));
            if (!quests.hasOwnProperty("daily")) quests["daily"] = null;
            if (!quests.hasOwnProperty("random")) quests["random"] = null;
            if (!quests.hasOwnProperty("raid")) quests["raid"] = null;

            // check if user finished the quest
            let completed: any[] = [];
            if (quests["daily"]) {
                const user = await User.findOne({where: {account}});
                if (user && user.dailyQuestClear) {
                    quests["daily"] = null;
                    completed.push("daily");
                }
            }
            if (quests["random"]) {
                const task = await Task.findOne({where: {userAccount: account, questId: quests["random"].id}});
                if (task) {
                    quests["random"] = null;
                    completed.push("random");
                }
            }
            if (quests["raid"]) {
                let cleared = false;
                switch (quests["raid"].checker) {
                    case "crossChainTransfer":
                        const boss = await Boss.findOne({where: {id: quests["raid"].id}});
                        cleared = boss && boss.hp === 0
                        break;
                    case "proposal":
                        quests["raid"].attackCount = proposalAttackCount;
                        const task = await Task.findOne({where: {userAccount: account, questId: quests["raid"].id}});
                        cleared = !!task;
                        break;
                }
                if (cleared) {
                    quests["raid"] = null;
                    completed.push("raid");
                }
            }

            return res.json({hasError: false, message: "", data: {quests, completed}});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.get(
    "/boss",
    [],
    async (req: Request, res: Response) => {
        let account = (req.user as any).account;
        try {
            let data: any = {
                hp: 0,
                totalHp: 0,
                damage: 0,
                mpUsed: 0
            };
            const quest = currentQuest["raid"];
            if (quest && quest.checker === "crossChainTransfer") {
                const attackerData = await getAttackerData(account, quest.id);
                const boss = await Boss.findOne({where: {id: quest.id}});
                data = {
                    hp: boss.hp,
                    totalHp: boss.totalHp,
                    ...attackerData
                }
            }
            return res.json({hasError: false, message: "", data});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.get(
    "/expList",
    [
        check("limit", "Limit can only be integer").isInt()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({errors: errors.array()});
        }

        const limit = parseInt(req.query.limit as string);
        try {
            let data: IExp[] = await Exp.findAll({
                where: {
                    show: true
                },
                limit,
                order: [
                    ["createdAt", "DESC"]
                ],
                raw: true
            });
            return res.json({hasError: false, message: "", data});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.post(
    "/share",
    [],
    async (req: Request, res: Response) => {
        let account = (req.user as any).account;
        try {
            const user = await User.findOne({where: {account}});
            if (user && !user.dailyShare) {
                const exp = parseFloat(config.get("SHARE_EXP"));
                await User.update({dailyShare: true}, {where: {account}});
                await addExp(account, exp, true);
                return res.json({hasError: false, message: `You've got ${exp} EXP`, data: {}});
            } else {
                return res.json({hasError: false, message: "Already shared today", data: {}});
            }
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

router.post(
    "/submit",
    [
        check("bsc_account", "bsc_account shouldn't be empty").notEmpty(),
        check("email", "email shouldn't be empty").notEmpty()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({errors: errors.array()});
        }

        let account = (req.user as any).account;
        const {bsc_account, email} = req.body;
        try {
            if (!winners.includes(account)) {
                return res.json({hasError: true, message: "No permission", data: {}});
            }

            await User.update({
                remark: JSON.stringify({bsc_account, email})
            }, {where: {account}});
            return res.json({hasError: false, message: "", data: {}});
        } catch (err) {
            logger.error("Server Error: " + err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
                errors: [{msg: err.message}]
            });
        }
    }
);

export default router;
