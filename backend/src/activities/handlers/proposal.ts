import { currentQuest } from "../register";
import Task from "../../models/Task";
import { addExp } from "./common";
import { logger } from "../../logger";

export async function proposalHandler(participants: string[]) {
    const quest = currentQuest["raid"];
    if (quest && quest.checker === "proposal") {
        // check quest finish time between startTime and endTime
        const now = new Date();
        const startTime = new Date(quest.startTime);
        const endTime = new Date(quest.endTime);

        if (startTime <= now && now < endTime) {
            // check if user finished the quest
            let tmp = [];
            for (let i = 0; i < participants.length; i++) {
                const account = participants[i];
                const task = await Task.findOne({where: {userAccount: account, questId: quest.id}});
                if (!task) tmp.push(account);
            }
            participants = tmp;

            if (participants.length) {
                let xp = Math.trunc(quest.reward.xp.value / participants.length);
                for (let i = 0; i < participants.length; i++) {
                    const account = participants[i];

                    await addExp(account, xp);

                    let remarks = {
                        reward: {xp}
                    }
                    await Task.create({userAccount: account, questId: quest.id, remarks: JSON.stringify(remarks)});

                    logger.info(`[Proposal Success]: user ${account} get ${xp} base EXP by proposal boss ${quest.id}`);
                }
            }
        }
    }
}
