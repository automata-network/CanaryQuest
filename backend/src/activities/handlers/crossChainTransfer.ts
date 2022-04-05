import { currentQuest } from "../register";
import Task from "../../models/Task";
import User from "../../models/User";
import Boss from "../../models/Boss";
import { bossDefeated } from "./common";
import config from "config";
import { logger } from "../../logger";

export async function crossChainTransferHandler(from: string, to: string, amount: number) {
    const quest = currentQuest["raid"];
    if (quest && quest.checker === "crossChainTransfer") {
        // check quest finish time between startTime and endTime
        const now = new Date();
        const startTime = new Date(quest.startTime);
        const endTime = new Date(quest.endTime);

        if (startTime <= now && now < endTime) {
            if (to === quest.targetAccount.toLowerCase()) {
                amount = Math.trunc(amount);
                const user = await User.findOne({where: {account: from}});
                if (user) {
                    const attack = parseFloat(config.get("BASE_ATTACK"));
                    let mpUsed = Math.min(amount, user.mp);
                    let damage = mpUsed * attack;

                    // check if user finished the quest
                    const boss = await Boss.findOne({where: {id: quest.id}});
                    if (boss && boss.hp > 0) {
                        const hpRemain = Math.max(boss.hp - damage, 0);
                        damage = boss.hp - hpRemain;
                        mpUsed = Math.ceil(damage / attack);
                        await User.update({mp: user.mp - mpUsed}, {where: {account: from}});
                        await Boss.update({hp: hpRemain}, {where: {id: quest.id}});
                        const remarks = {damage, mpUsed};
                        await Task.create({userAccount: from, questId: quest.id, remarks: JSON.stringify(remarks)});

                        logger.info(`[Boss Attack]: ${user.nickname}(${user.account}) attacked boss(${quest.id}), caused ${damage} damage and used ${mpUsed} mp`);
                        if (!hpRemain) await bossDefeated();
                    }
                }
            }
        }
    }
}
