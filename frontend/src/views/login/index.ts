import Cookies from "js-cookie";
import VueRecaptcha from "vue-recaptcha";
import { Component, Vue, Inject } from "vue-property-decorator";

import Rem from "@/mixins/rem";
import Box from "@/components/box";
import Modal from "@/components/modal";
import { commonSetting } from "@/settings";
import QuestService from "@/services/quest";
import validAddress from "@/utils/validAddress";

import "./index.scss";

@Component({
    name: "Login",
    template: require("./index.html"),
    mixins: [Rem],
    components: {
        VueRecaptcha,
        "u-box": Box,
        "u-modal": Modal
    }
})
export default class Login extends Vue {
    @Inject()
    public showErrorMsg!: Function;

    public siteKey = commonSetting.reCaptchaSiteKey;
    public loading = false;
    public showLogin = false;
    public showCharacter = false;
    public account = "";
    public password = "";
    public nickname = "";
    public character = null;
    public characterDesc = [
        "Warriors known for valor and honor in battle with their impressive display of strength",
        "Healers unleash the force of nature with their keen intelligence and energy",
        "Rogues rely on their stealth and agility to eliminate threats decisively",
        "Spellcasters study and master the arcane arts to conjure powerful magic",
        "Archers excel in long-range combat with their perception and finely-tuned skills"
    ];

    public async onVerify(token: string) {
        let res = await QuestService.instance.login(this.account, this.password, token);
        this.loading = false;
        (this.$refs.recaptcha as VueRecaptcha).reset();
        if (res && !res.hasError) {
            localStorage.setItem("canary-game-account", this.account);
            Cookies.set("access_token", res.data.access_token);
            if (res.data.newbie) {
                this.showLogin = false;
                setTimeout(() => {
                    this.nickname = "";
                    this.character = null;
                    this.showCharacter = true;
                }, 500);
            } else {
                await this.$router.push("/index");
            }
        } else {
            let msg = res?.message || "Server Error";
            this.showErrorMsg(msg);
        }
    }

    public onStartClick() {
        this.account = localStorage.getItem("canary-game-account") || "";
        this.password = "";
        this.showLogin = true;
    }

    public onLoginClick() {
        if (this.loading) return;
        if (!this.account || !validAddress(this.account)) {
            this.showErrorMsg("Please enter a valid address");
            return;
        }
        if (!this.password) {
            this.showErrorMsg("Please enter the password");
            return;
        }
        this.loading = true;
        (this.$refs.recaptcha as VueRecaptcha).execute();
    }

    public async onCreateClick() {
        if (this.loading) return;
        if (!this.nickname) {
            this.showErrorMsg("Please enter your nickname");
            return;
        }
        if (!this.character) {
            this.showErrorMsg("Please choose your character");
            return;
        }

        this.loading = true;
        let res = await QuestService.instance.create(this.nickname, this.character);
        this.loading = false;
        if (res && !res.hasError) {
            await this.$router.push("/index");
        } else {
            this.showErrorMsg("Server Error: Create character failed.");
        }
    }
}
