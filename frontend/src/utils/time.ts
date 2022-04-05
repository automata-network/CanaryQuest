export default class TimeUtil {
    public static parseTime(time: number) {
        if (!time) return "";

        let days = Math.floor(time / (1000 * 60 * 60 * 24));
        time -= days * (1000 * 60 * 60 * 24);
        let hours = Math.floor(time / (1000 * 60 * 60));
        time -= hours * (1000 * 60 * 60);
        let minutes = Math.floor(time / (1000 * 60));
        time -= minutes * (1000 * 60);
        let seconds = Math.floor(time / 1000);

        let res = "";
        if (days > 0) res += days + "天";
        if (hours > 0) res += hours + "小时";
        if (minutes > 0) res += minutes + "分";
        if (seconds > 0) res += seconds + "秒";
        return  res;
    }

    public static countdownTimer(time: string, showAll: boolean = false) {
        const difference = Math.abs(+new Date(time) - +new Date());
        let timeLeft: any = {};

        if (difference > 0) {
            timeLeft = {
                "d": Math.floor(difference / (1000 * 60 * 60 * 24)),
                "h": Math.floor((difference / (1000 * 60 * 60)) % 24),
                "m": Math.floor((difference / 1000 / 60) % 60),
                "s": Math.floor((difference / 1000) % 60)
            };
        }

        Object.keys(timeLeft).forEach(key => {
            if (!showAll && key !== "d") {
                if (timeLeft[key].toString().length < 2) {
                    timeLeft[key] = "0" + timeLeft[key];
                }
            }
        });

        if (showAll) {
            let arr: Array<string> = [];
            arr.push(timeLeft["d"] + "d");
            arr.push(timeLeft["h"] + "h");
            arr.push(timeLeft["m"] + "m");
            arr.push(timeLeft["s"] + "s");
            return arr.join(":");
        } else {
            if (timeLeft["d"] > 0) {
                return `${timeLeft["d"]} DAYS`;
            } else {
                let arr: Array<string> = [];
                arr.push(timeLeft["h"]);
                arr.push(timeLeft["m"]);
                arr.push(timeLeft["s"]);
                return arr.join(":");
            }
        }
    }
}
