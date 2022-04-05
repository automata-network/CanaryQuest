import { Component, Vue, Prop } from "vue-property-decorator";

import "./index.scss";

@Component({
    name: "Box",
    template: require("./index.html")
})
export default class Box extends Vue {
    @Prop({type: String, default: "400px"})
    public width!: string;

    @Prop({type: String, default: "300px"})
    public height!: string;

    @Prop({type: String, default: "#6D7C84"})
    public boxBgColor!: string;

    @Prop({type: String, default: "#001826"})
    public contentBgColor!: string;

    @Prop({type: String, default: "#FFFFFF"})
    public borderColor!: string;

    @Prop({type: String, default: "5px"})
    public borderWidth!: string;

    @Prop({type: Boolean, default: false})
    public loading!: boolean;
}
