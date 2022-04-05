import schedule from "node-schedule";
import User from "../../models/User";
import config from "config";

export function setDailyCleanUp() {
    schedule.scheduleJob("0 0 0 * * ?", async () => {
        const users = await User.findAll();
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            await User.update({
                mp: parseInt(config.get("MP_LIMIT_DAILY")) + user.intellect,
                dailyQuestClear: false,
                dailyShare: false
            }, {where: {id: user.id}});
        }
    });
}
