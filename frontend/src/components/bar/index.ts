import { Component, Vue, Prop, Emit } from "vue-property-decorator";

import "./index.scss";
import Box from "@/components/box";
import Rem from "@/mixins/rem";

@Component({
    name: "Bar",
    template: require("./index.html"),
    mixins: [Rem],
    components: {
        "u-box": Box
    }
})
export default class Bar extends Vue {
    @Prop({type: String, default: "400px"})
    public width!: string;

    @Prop({type: String, default: "300px"})
    public height!: string;

    @Prop({type: String, default: "#21A300"})
    public color!: string;

    @Prop({type: Number, default: 0})
    public step!: number;

    @Prop({type: Number, default: 10})
    public maxStep!: number;

    @Prop({type: Boolean, default: false})
    public showAdd!: boolean;

    @Prop({type: Boolean, default: false})
    public showLabel!: boolean;

    @Prop({type: String, default: ""})
    public label!: string;

    @Prop({type: String, default: ""})
    public hoverText!: string;

    public get labelSize() {
        return parseInt(this.height) / 3 * 2 + "px";
    }

    @Emit()
    public onAddClick() {
        // Emit click event to parent
    }
}
