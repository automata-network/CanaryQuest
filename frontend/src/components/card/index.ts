import { Component, Vue, Prop, Emit, Watch } from "vue-property-decorator";

import "./index.scss";
import Box from "@/components/box";
import Rem from "@/mixins/rem";
import TimeUtil from "@/utils/time";
import { commonSetting } from "@/settings";

@Component({
    name: "Card",
    template: require("./index.html"),
    mixins: [Rem],
    components: {
        "u-box": Box
    }
})
export default class Card extends Vue {
    @Prop({type: String, default: "daily"})
    public type!: string;

    @Prop({required: true, default: null})
    public info!: any;

    @Prop({type: Boolean, default: true})
    public showFlip!: boolean;

    @Prop({type: Boolean, default: false})
    public customContent!: boolean;

    @Prop({type: Boolean, default: false})
    public completed!: boolean;

    public colors = {
        daily: {
            boxBg: "#6D846F",
            contentBg: "#013900",
            avatarBoxBg: "#006B04",
            avatarBorder: "#00A911",
            btnBorder: "#0B7501",
            btnBoxBg: "#88FF94",
            btnContentBg: "#00A911"
        },
        random: {
            boxBg: "#847F6D",
            contentBg: "#483400",
            avatarBoxBg: "#857001",
            avatarBorder: "#D4B300",
            btnBorder: "#755B01",
            btnBoxBg: "#FFD788",
            btnContentBg: "#A99800"
        },
        raid: {
            boxBg: "#866767",
            contentBg: "#4F0000",
            avatarBoxBg: "#970000",
            avatarBorder: "#D90000",
            btnBorder: "#970000",
            btnBoxBg: "#FFA0A0",
            btnContentBg: "#FF3333"
        }
    };

    public unlockText = "";
    public timer: any = undefined;

    public get baseUrl() {
        return commonSetting.baseUrl;
    }

    @Emit()
    public onButtonClick() {
        // Emit click event to parent
    }

    public mounted() {
        this.handleFlip();

        this.$once("hook:beforeDestroy", () => {
            clearInterval(this.timer);
        });
    }

    @Watch("completed")
    public handleCompleted() {
        if (this.completed) {
            this.flip(true);
            clearInterval(this.timer);
        }
    }

    @Watch("info", {deep: true})
    public handleFlip() {
        if (!this.info) {
            this.unlockText = "";
            this.flip(true);
            clearInterval(this.timer);
        }
        if (this.showFlip) {
            if (this.info && this.info.startTime) {
                const countDown = () => {
                    if (this.info) {
                        const now = new Date();
                        const startTime = new Date(this.info.startTime);
                        const endTime = this.info.endTime ? new Date(this.info.endTime) : undefined;

                        if (now < startTime) {
                            this.unlockText = TimeUtil.countdownTimer(this.info.startTime);
                        } else {
                            this.flip();
                            if (endTime) {
                                if (now > endTime) {
                                    this.unlockText = "";
                                    this.flip(true);
                                    clearInterval(this.timer);
                                }
                            } else {
                                clearInterval(this.timer);
                            }
                        }
                    }
                };
                countDown();
                this.timer = setInterval(() => {
                    countDown();
                }, 1000);
            } else {
                // this.flip();
            }
        }
    }

    public flip(back: boolean = false) {
        setTimeout(() => {
            let _;
            let card = this.$refs["card"] as HTMLElement;
            _ = card.offsetWidth;
            if (back) {
                card.classList.remove("flip");
            } else {
                card.classList.add("flip");
            }
        }, 600);
    }
}
