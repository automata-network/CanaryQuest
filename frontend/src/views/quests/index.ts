import { Component, Inject, Vue, Watch } from "vue-property-decorator";
import validator from "validator";
import Web3Utils from "web3-utils";

import Rem from "@/mixins/rem";
import Box from "@/components/box";
import Bar from "@/components/bar";
import Card from "@/components/card";
import Modal from "@/components/modal";
import TimeUtil from "@/utils/time";

import "./index.scss";
import QuestService from "@/services/quest";
import Cookies from "js-cookie";

@Component({
    name: "Quests",
    template: require("./index.html"),
    mixins: [Rem],
    components: {
        "u-box": Box,
        "u-bar": Bar,
        "u-card": Card,
        "u-modal": Modal
    }
})
export default class Quests extends Vue {
    @Inject()
    public showErrorMsg!: Function;

    @Inject()
    public showSuccessMsg!: Function;

    public loading = false;
    public showFAQ = false;
    public FAQ = [
        {
            question: "What is the maximum level for a player?",
            answer: "The level cap is 10, although players can continue to accumulate EXP points after reaching the maximum level."
        },
        {
            question: "How is ranking on the leaderboard decided?",
            answer: "Players are crowned based on their accumulated EXP points at the end of the game."
        },
        {
            question: "Can I reset my attributes?",
            answer: "It is not possible to do so, so spend your points wisely!"
        },
        {
            question: "How long does the Canary Quest last?",
            answer: "Canary Quest will run from 14 February 00:00 UTC to 27 February 22:00 UTC."
        },
        {
            question: "What are the different types of quests?",
            answer: "Daily quests, represented by green cards, can be completed once per day. Yellow cards are random quests which are more challenging and provide more EXP. Boss quests, displayed in red cards, require effort, but are the most fun!"
        },
        {
            question: "How many quests can I have active at the same time?",
            answer: "There is no limit to the number of quests you can try as long as it is completed within the time limit."
        },
        {
            question: "When are quests reset?",
            answer: "Daily quests are reset at 00:00 UTC, while random quests will appear at selected time intervals. Boss quests are special events that run for a limited period of time."
        },
        {
            question: "How long does it take for EXP points to show up after a quest is completed?",
            answer: "There may be a slight delay after you finish a mission. If it takes longer than usual or if your character fails to receive any EXP points, please check out <a target='_blank' href='https://discord.com/invite/dCCjWK86TF'>our official Discord</a> with more information and to get in contact with the team for help."
        },
        {
            question: "Can’t find what you are looking for?",
            answer: "Contact us at <a target='_blank' href='https://discord.com/invite/dCCjWK86TF'>our Discord</a> with your question."
        }
    ];
    public showQuest = false;
    public info: any = {};
    public questEndTime: string = "";
    public timer: any = {};
    public showRank = false;
    public rankList = [];
    public showSharedInfo = false;
    public sharedResult = "";

    public showConfirm = false;
    public confirmTitle = "";
    public confirmFunc = new Function();
    public addPointType = "";

    public abilitiesType: any = {
        strength: "STR",
        intellect: "INT",
        dexterity: "DEX"
    };

    public boss: any = {
        hp: 0,
        totalHp: 0,
        damage: 0,
        mpUsed: 0
    };
    public user: any = {
        account: "",
        nickname: "",
        level: 0,
        xp: 0,
        nextXp: 10,
        mp: 0,
        mpLimitDaily: 50,
        strength: 0,
        intellect: 0,
        dexterity: 0,
        remainPoints: 0
    };

    public completed = [];
    public quests: any = {
        daily: null,
        random: null,
        raid: null
    };

    public formFirstShow = true;
    public showForm = false;
    public winner: any = {
        bsc_account: "",
        email: ""
    };

    public get userInfo() {
        let data: any = {};
        if (this.user.nextXp) {
            data.xpText = `${this.user.xp}/${this.user.nextXp} EXP`;
            data.xpStep = Math.floor(this.user.xp / this.user.nextXp * 10);
        } else {
            data.xpText = `${this.user.xp} EXP`;
            data.xpStep = 10;
        }
        data.mpText = `${this.user.mp}/${this.user.mpLimitDaily + this.user.intellect} MP`;
        data.mpStep = Math.floor(this.user.mp / (this.user.mpLimitDaily + this.user.intellect) * 10);
        return data;
    }

    public get userAbilities() {
        const maxStep = 10;
        let res: any = {};
        Object.keys(this.abilitiesType).forEach(type => {
            res[this.abilitiesType[type]] = {
                title: type.toUpperCase(),
                maxStep: maxStep,
                showLabel: this.user[type] > maxStep,
                label: "+" + Math.trunc((this.user[type] - 1) / maxStep),
                step: this.user[type] ? this.user[type] % maxStep || maxStep : 0,
                hoverText: this.user[type] + " " + type.toUpperCase()
            };
            switch (this.abilitiesType[type]) {
                case this.abilitiesType.strength:
                    res[this.abilitiesType[type]]["labelColor"] = "#FFA0A0";
                    res[this.abilitiesType[type]]["color"] = "#FF5555";
                    break;
                case this.abilitiesType.intellect:
                    res[this.abilitiesType[type]]["labelColor"] = "#94E5FF";
                    res[this.abilitiesType[type]]["color"] = "#55D6FF";
                    break;
                case this.abilitiesType.dexterity:
                    res[this.abilitiesType[type]]["labelColor"] = "#D898FF";
                    res[this.abilitiesType[type]]["color"] = "#BC4EFF";
                    break;
            }
        });
        return res;
    }

    public mounted() {
        const token = Cookies.get("access_token");
        if (!token) {
            this.$router.push("/login");
            return;
        }

        (window as any).copyText = this.copyText;
        this.pollingForData();
        // this.showExpCarousel();
    }

    public copyText(s: string) {
        this.$copyText(s).then(() => {
            this.showSuccessMsg("Copied");
        });
    }

    public async showExpCarousel() {
        const genExpCarouselItem = (str: string) => {
            return new Promise(resolve => {
                let node = document.createElement("div");
                node.className = "carousel-item";
                node.innerHTML = str;

                const carousel = this.$refs["carousel"] as Element;
                carousel.appendChild(node);
                setTimeout(() => {
                    carousel.removeChild(node);
                    resolve();
                }, 5000);
            });
        };

        let expCarouselList = [];
        let res = await QuestService.instance.getExpList();
        if (res && !res.hasError) {
            expCarouselList = res.data;
        }
        expCarouselList = expCarouselList.map((item: any) => {
            return `${item.nickname} gets ${item.xp} ${item.double ? "double" : ""} EXP!`;
        });

        for (let i = 0; i < expCarouselList.length; i++) {
            await genExpCarouselItem(expCarouselList[i]);
        }
        let timer = setTimeout(async () => {
            await this.showExpCarousel();
        }, 1000 * 60);

        this.$once("hook:beforeDestroy", () => {
            clearTimeout(timer);
        });
    }

    public async pollingForData() {
        const getUserInfo = async () => {
            let res = await QuestService.instance.getUserInfo();
            if (res && !res.hasError) {
                this.user = {
                    ...res.data,
                    ...{
                        account: localStorage.getItem("canary-game-account")
                    }
                };
                if (this.user.winner) {
                    if (this.formFirstShow) {
                        if (this.user.remark) {
                            const raw = JSON.parse(this.user.remark);
                            this.winner = {
                                bsc_account: raw.bsc_account,
                                email: raw.email
                            };
                        } else {
                            this.winner = {
                                bsc_account: "",
                                email: ""
                            };
                        }
                        this.showForm = true;
                        this.formFirstShow = false;
                    }
                }
            } else {
                this.showErrorMsg("Server Error: Get user info failed.");
            }
        };
        await getUserInfo();
        this.timer["getUserInfo"] = setInterval(async () => {
            await getUserInfo();
        }, 1000 * 10);

        const getQuests = async () => {
            let res = await QuestService.instance.getQuests();
            if (res && !res.hasError) {
                this.quests = {...res.data.quests};
                this.completed = res.data.completed;
                Object.keys(this.quests).forEach(type => {
                    if (!this.quests[type] && this.info?.type === type && this.showQuest) this.showQuest = false;
                });
            } else {
                this.showErrorMsg("Server Error: Get quests info failed.");
            }
        };
        await getQuests();
        this.timer["getQuests"] = setInterval(async () => {
            await getQuests();
        }, 1000 * 10);

        this.$once("hook:beforeDestroy", () => {
            Object.keys(this.timer).forEach(key => {
                clearInterval(this.timer[key]);
            });
        });
    }

    @Watch("showQuest")
    public async questTimer() {
        if (this.showQuest && this.info.type === "raid") {
            let res = await QuestService.instance.getBossInfo();
            if (res && !res.hasError) {
                this.boss = {...res.data};
            } else {
                this.showErrorMsg("Server Error: Get boss info failed.");
            }
        }

        if (this.showQuest && this.info.endTime && this.timer["questEndTime"] === undefined) {
            const countDown = () => {
                const now = new Date();
                const endTime = new Date(this.quests[this.info.type].endTime);

                if (now < endTime) {
                    this.questEndTime = TimeUtil.countdownTimer(this.quests[this.info.type].endTime, true);
                } else {
                    this.showQuest = false;
                    clearInterval(this.timer["questEndTime"]);
                    this.timer["questEndTime"] = undefined;
                }
            };
            countDown();
            this.timer["questEndTime"] = setInterval(() => {
                countDown();
            }, 1000);
        } else {
            clearInterval(this.timer["questEndTime"]);
            this.timer["questEndTime"] = undefined;
        }
    }

    public shortenAddress(address: string, decimal: number = 4) {
        return `${address.substr(0, decimal)}...${address.substr(address.length - decimal, decimal)}`;
    }

    public rankAvatarColor(rank: number) {
        switch (rank) {
            case 0:
                return "#FFB800";
            case 1:
                return "#8B9299";
            case 2:
                return "#884100";
            default:
                return "#FFFFFF";
        }
    }

    public onAddClick(shortType: string) {
        if (this.loading) return;
        if (this.user.remainPoints) {
            this.addPointType = shortType;
            this.confirmTitle = `Add 1 ${shortType}?`;
            this.confirmFunc = this.addPoint;
            this.showConfirm = true;
        } else {
            this.showErrorMsg("No points remaining");
        }
    }

    public async addPoint() {
        let type = Object.keys(this.abilitiesType).find(key => this.abilitiesType[key] === this.addPointType);
        if (type) {
            this.loading = true;
            let res = await QuestService.instance.addPoint(type);
            this.loading = false;
            if (res && !res.hasError) {
                this.user[type]++;
            } else {
                let msg = res?.message || "Server Error";
                this.showErrorMsg(msg);
            }
        }
        this.showConfirm = false;
    }

    public async onRankClick() {
        this.showRank = true;
        this.loading = true;
        let res = await QuestService.instance.getRank();
        this.loading = false;
        if (res && !res.hasError) {
            this.rankList = res.data;
        } else {
            let msg = res?.message || "Server Error";
            this.showErrorMsg(msg);
        }
    }

    public async onShareClick() {
//         let website = window.location.origin;
//         let characterText;
//         switch (this.user.character) {
//             case 1:
//                 characterText = "knight";
//                 break;
//             case 2:
//                 characterText = "druid";
//                 break;
//             case 3:
//                 characterText = "assassin";
//                 break;
//             case 4:
//                 characterText = "wizard";
//                 break;
//             case 5:
//                 characterText = "ranger";
//                 break;
//         }
//         let text = `${this.user.nickname} has progressed to Level ${this.user.level} ${characterText} in the Canary Quests. Will victory be yours in the eternal darkness of the Forest?
//
// Tip the battle in your favor with Automata.`;
//         text = encodeURIComponent(text);
//         const url = `https://twitter.com/intent/tweet?url=${website}&text=${text}`;
//         window.open(url, "_blank");
//
//         let res = await QuestService.instance.share();
//         if (res && !res.hasError) {
//             this.showSharedInfo = true;
//             this.sharedResult = res.message;
//         }
    }

    public onFAQClick() {
        this.showFAQ = true;
    }

    public onLogoutClick() {
        this.confirmTitle = "LOG OUT NOW?";
        this.confirmFunc = this.logout;
        this.showConfirm = true;
    }

    public logout() {
        this.showConfirm = false;
        Cookies.remove("access_token");
        this.$router.push("/login");
    }

    public onQuestClick(type: string) {
        this.info = this._.cloneDeep(this.quests[type]);
        this.info.type = type;
        this.info.btnText = "GO BACK TO CHARACTER PAGE";
        this.showQuest = true;
    }

    public async onFormSubmitClick() {
        if (this.loading) return;
        if (!this.winner.bsc_account || !Web3Utils.isAddress(this.winner.bsc_account)) {
            this.showErrorMsg("Please enter a valid address");
            return;
        }
        if (!this.winner.email || !validator.isEmail(this.winner.email)) {
            this.showErrorMsg("Please enter a valid email");
            return;
        }
        this.loading = true;
        let res = await QuestService.instance.submit(this.winner.bsc_account, this.winner.email);
        this.loading = false;
        if (res && !res.hasError) {
            this.showSuccessMsg("Submitted");
            this.showForm = false;
        } else {
            let msg = res?.message || "Server Error";
            this.showErrorMsg(msg);
        }
    }
}
