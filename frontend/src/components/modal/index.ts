import { Component, Vue, PropSync, Watch, Prop } from "vue-property-decorator";

import "./index.scss";

@Component({
    name: "Modal",
    template: require("./index.html")
})
export default class Modal extends Vue {
    @PropSync("visible", { type: Boolean, default: false })
    public show!: boolean;

    @Prop({type: String, default: "drop"})
    public type!: string;

    @Prop({type: Boolean, default: true})
    public maskClose!: boolean;

    public showModal = false;

    @Watch("show")
    public onVisibleChange() {
        if (this.show) {
            this.showModal = true;
        } else {
            let _;
            let mask = this.$refs["mask"] as HTMLElement;
            mask.classList.remove("bg-show");
            _ = mask.offsetWidth;
            mask.classList.add("bg-hide");

            let content = this.$refs["content"] as HTMLElement;
            content.classList.remove(`content-show-${this.type}`);
            _ = content.offsetWidth;
            content.classList.add(`content-hide-${this.type}`);

            setTimeout(() => {
                this.showModal = false;
            }, 500);
        }
    }

    public onMaskClick() {
        if (this.maskClose) {
            this.show = false;
        }
    }
}
