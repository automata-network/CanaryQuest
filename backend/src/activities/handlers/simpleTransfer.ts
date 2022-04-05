import { currentQuest } from "../register";
import Task from "../../models/Task";
import User from "../../models/User";
import config from "config";
import { addExp, addMp } from "./common";
import { logger } from "../../logger";

export async function simpleTransferHandler(from: string, to: string, amount: number) {
    const checkQuestFinished = async (quest: any) => {
        // check quest finish time between startTime and endTime
        const now = new Date();
        const startTime = new Date(quest.startTime);
        const endTime = new Date(quest.endTime);

        if (startTime <= now && now < endTime) {
            // check if user finished the quest
            let cleared = false;
            if (quest.checker === "simpleTransfer") {
                const user = await User.findOne({where: {account: from}});
                if (user) {
                    if (quest.type === "daily") {
                        cleared = !!user.dailyQuestClear;
                    } else {
                        const task = await Task.findOne({where: {userAccount: from, questId: quest.id}});
                        cleared = !!task;
                    }
                }

                if (user && !cleared) {
                    if (to === quest.targetAccount.toLowerCase()) {
                        const amountCheck = quest.cost.mp.exactly ? amount === quest.cost.mp.value : amount >= quest.cost.mp.value;
                        if (amountCheck) {
                            if (quest.cost.mp.value <= user.mp) {
                                let values: any = {
                                    mp: user.mp - quest.cost.mp.value
                                }
                                if (quest.type === "daily") {
                                    values.dailyQuestClear = true;
                                }
                                await User.update(values, {where: {account: from}});
                                await addExp(from, quest.reward.xp.value);

                                const remarks = {
                                    cost: {mp: quest.cost.mp.value},
                                    reward: {xp: quest.reward.xp.value}
                                }
                                await Task.create({userAccount: from, questId: quest.id, remarks: JSON.stringify(remarks)});

                                logger.info(`[Simple Transfer]: ${user.nickname}(${user.account}) cost ${quest.cost.mp.value} MP and get ${quest.reward.xp.value} base EXP in quest ${quest.id}`);
                                return true;
                            }
                        }
                    }
                }
            } else if (quest.checker === "crossChainTransfer") {
                const user = await User.findOne({where: {account: to}});
                const task = await Task.findOne({where: {userAccount: to, questId: quest.id}});
                cleared = !!task;

                if (user && !cleared) {
                    if (from === (config.get("SUBSTRATE_FUND_POOL") as string).toLowerCase()) {
                        const amountCheck = quest.cost.token.exactly ? amount === quest.cost.token.value : amount >= quest.cost.token.value;
                        if (amountCheck) {
                            await addMp(to, quest.reward.mp.value);
                            await addExp(to, quest.reward.xp.value);

                            const remarks = {
                                cost: {token: amount},
                                reward: {
                                    xp: quest.reward.xp.value,
                                    mp: quest.reward.mp.value,
                                }
                            }
                            await Task.create({userAccount: to, questId: quest.id, remarks: JSON.stringify(remarks)});

                            logger.info(`[Cross Chain Transfer]: ${user.nickname}(${user.account}) cost ${amount} token to get ${quest.reward.mp.value} MP and ${quest.reward.xp.value} base EXP in quest ${quest.id}`);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Check random quest first then daily quest
    let quest = currentQuest["random"];
    let finished = false;
    if (quest) finished = await checkQuestFinished(quest);
    if (finished) return;

    quest = currentQuest["daily"];
    if (quest) await checkQuestFinished(quest);
}
