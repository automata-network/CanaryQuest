import User from "../../models/User";
import Task from "../../models/Task";
import Exp from "../../models/Exp";
import config from "config";
import { currentQuest } from "../register";
import { logger } from "../../logger";

export async function addExp(account: string, exp: number, fixed: boolean = false) {
    const expList = [0, 0, 10, 20, 60, 160, 350, 800, 1700, 3400, 6000, Infinity];

    const user = await User.findOne({where: {account}});
    if (user) {
        let critical = false;
        // If fixed is true, will not trigger double exp
        if (!fixed) {
            const doubleChance = parseFloat(config.get("CRITICAL_CHANCE_PER_DEX")) * user.dexterity;
            const additionalExp = parseFloat(config.get("ADDITIONAL_EXP_PER_STR")) * user.strength;
            exp = exp * (1 + additionalExp);
            if (Math.random() < doubleChance) {
                exp *= 2;
                if (Math.trunc(exp) != 0) {
                    critical = true;
                }
            }
        }

        exp = Math.trunc(exp);

        let level = user.level;
        let xp = user.xp + exp;
        let nextXp = user.nextXp;
        let totalXp = user.totalXp + exp;

        while (xp >= nextXp) {
            level++;
            xp -= nextXp;
            nextXp = expList[level + 1];
        }

        await User.update({level, xp, nextXp, totalXp}, {where: {account}});

        const expLimit = parseInt(config.get("EXP_LIMIT_IN_CAROUSEL"));
        const showInCarousel = critical || exp >= expLimit;
        await Exp.create({
            account: user.account,
            nickname: user.nickname,
            xp: exp,
            double: critical,
            show: showInCarousel
        });

        logger.info(`[Add Exp]: ${user.nickname}(${user.account}) get ${exp} ${critical ? "DOUBLE" : ""} EXP`);
    }
}

export async function addMp(account: string, mp: number) {
    mp = Math.trunc(mp);
    const user = await User.findOne({where: {account}});
    if (user) {
        mp = Math.min(user.mp + mp, parseInt(config.get("MP_LIMIT_DAILY")) + user.intellect);
        await User.update({mp}, {where: {account}});

        logger.info(`[Add Mp]: ${user.nickname}(${user.account}) get ${mp} MP`);
    }
}

export async function getAttackerData(account: string, bossId: string) {
    const records = await Task.findAll({where: {userAccount: account, questId: bossId}});
    let data = {
        damage: 0,
        mpUsed: 0
    }
    records.forEach(task => {
        const remarks = JSON.parse(task.remarks);
        data.damage += remarks.damage;
        data.mpUsed += remarks.mpUsed;
    });

    logger.info(`[Attacker Info]: user ${account} caused ${data.damage} damage and used ${data.mpUsed} mp in boss ${bossId}`);
    return data;
}

export async function bossDefeated() {
    const quest = currentQuest["raid"];
    if (quest && quest.checker === "crossChainTransfer") {
        const users = await User.findAll();
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const data = await getAttackerData(user.account, quest.id);
            const xp = Math.trunc(data.damage / quest.reward.xp.unit.value) * quest.reward.xp.value;
            await addExp(user.account, xp);
        }
    }
}
