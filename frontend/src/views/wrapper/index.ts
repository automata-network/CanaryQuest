import { Component, Vue, Provide } from "vue-property-decorator";
import { cachePageList } from "@/settings";

import Rem from "@/mixins/rem";
import Box from "@/components/box";
import Modal from "@/components/modal";

import "./index.scss";

@Component({
    name: "wrapper",
    template: require("./index.html"),
    mixins: [Rem],
    components: {
        "u-box": Box,
        "u-modal": Modal
    }
})
export default class Wrapper extends Vue {
    public cachePageList: Array<any> = cachePageList;
    public showError = false;
    public errorMessage = "";
    public showSuccess = false;
    public successMessage = "";
    public timer: any = {};
    public showImgModal = false;
    public imgUrl = "";

    @Provide()
    public showErrorMsg = this.errorMsgHandler;

    @Provide()
    public showSuccessMsg = this.successMsgHandler;

    public get isMobile() {
        return navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i);
    }

    public mounted() {
        (window as any).showBigImg = (url: string) => {
            this.imgUrl = url;
            this.showImgModal = true;
        };
    }

    public errorMsgHandler(message: string) {
        this.errorMessage = message;
        this.showError = true;

        if (this.timer["error"] !== undefined) clearTimeout(this.timer["error"]);
        this.timer["error"] = setTimeout(() => {
            this.showError = false;
            delete this.timer["error"];
        }, 3000);
    }

    public successMsgHandler(message: string) {
        this.successMessage = message;
        this.showSuccess = true;

        if (this.showError) {
            clearTimeout(this.timer["error"]);
            delete this.timer["error"];
            this.showError = false;
        }

        if (this.timer["success"] !== undefined) clearTimeout(this.timer["success"]);
        this.timer["success"] = setTimeout(() => {
            this.showSuccess = false;
            delete this.timer["success"];
        }, 1500);
    }
}
