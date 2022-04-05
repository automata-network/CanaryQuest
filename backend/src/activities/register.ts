import schedule from "node-schedule";

import { setDailyCleanUp } from "./handlers/dailyCleanUp";
import { getMainNode } from "../utils/mainNode";
import { simpleTransferHandler } from "./handlers/simpleTransfer";
import { crossChainTransferHandler } from "./handlers/crossChainTransfer";
import { proposalHandler } from "./handlers/proposal";
import Boss from "../models/Boss";
import axios from "axios";
import config from "config";
import { logger } from "../logger";

export let currentQuest: any = {};
export let proposalAttackCount = 0;
let version = "";

const insertBossInfo = async (quest: any) => {
    if (quest.type === "raid" && quest.checker === "crossChainTransfer") {
        const boss = await Boss.findOne({where: {id: quest.id}});
        if (!boss) {
            await Boss.create({id: quest.id, hp: quest.totalHp, totalHp: quest.totalHp});
        }
    }
}

const pollingForQuestsConfig = async () => {
    let res: any;
    try {
        res = await axios.get(process.env.QUESTS_CONFIG_URL || config.get("QUESTS_CONFIG_URL"));
    } catch (err) {
        logger.error(err);
    }
    let data = res?.data || require("../../config/activities.json");
    if (data) {
        if (data.version !== version) {
            version = data.version;
            logger.info("Current Quest Config Version: " + version);
            await (schedule as any).gracefulShutdown();
            setDailyCleanUp();
            data.data.forEach((item: any) => {
                const now = new Date();
                const appearTime = new Date(item.appearTime);
                const endTime = new Date(item.endTime);

                if (now < endTime) {
                    if (now >= appearTime) {
                        if (!currentQuest.hasOwnProperty(item.type)) {
                            currentQuest[item.type] = item;
                            insertBossInfo(item);
                        } else if (currentQuest[item.type].id === item.id) {
                            currentQuest[item.type].endTime = item.endTime;
                        }
                    } else {
                        schedule.scheduleJob(appearTime, () => {
                            if (!currentQuest.hasOwnProperty(item.type)) {
                                currentQuest[item.type] = item;
                                insertBossInfo(item);
                            }
                        });
                    }

                    schedule.scheduleJob(endTime, () => {
                        if (currentQuest[item.type].id === item.id) {
                            delete currentQuest[item.type];
                        }
                    });
                }
            });
        }
    }
}

const addEventListener = async () => {
    const api = await getMainNode();

    // Subscribe events and distribute to handlers
    await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        const blockHash = header.hash;
        const events = await api.query.system.events.at(blockHash);

        for (let i = 0; i < events.length; i++) {
            const event = events[i].event;
            const types = event.typeDef;

            let dataList: string[] = [];
            event.data.forEach((data, index) => {
                dataList.push(`${types[index].type}: ${data.toHuman()}`);
            });

            logger.info(`[Event Received]: ${event.section}:${event.method} at block #${header.number}(${blockHash}) with data: ${JSON.stringify(dataList)}`);

            if (event.section === "balances" && event.method === "Transfer") {
                const from = (event.data[0].toHuman() as string).toLowerCase();
                const to = (event.data[1].toHuman() as string).toLowerCase();
                const amount = parseFloat(event.data[2].toString() as string) / Math.pow(10, 18);
                await simpleTransferHandler(from, to, amount);
            }

            if (event.section === "game" && event.method === "AttackBoss") {
                const participants = (event.data[0] as unknown as any[]).map(s => s.toString().toLowerCase());
                await proposalHandler(participants);
            }

            if (event.section === "bridgeTransfer" && event.method === "BridgeFungibleTransferOut") {
                const from = (event.data[0].toHuman() as string).toLowerCase();
                const to = (event.data[1].toHuman() as string).toLowerCase();
                const amount = parseFloat((event.data[2].toHuman() as string).replace(/,/g, "")) / Math.pow(10, 18);
                await crossChainTransferHandler(from, to, amount);
            }
        }
    });

    api.query.game.attackCount((data: any) => {
        proposalAttackCount = data.toNumber();
        logger.info(`Proposal Attack Count: ${proposalAttackCount}`);
    });
}

export default async function register() {
    await pollingForQuestsConfig();
    setInterval(async () => {
        await pollingForQuestsConfig();
    }, 1000 * 60 * 5);

    await addEventListener();
}
