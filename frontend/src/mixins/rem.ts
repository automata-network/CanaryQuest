import { Component, Vue } from "vue-property-decorator";

@Component({
    name: "Rem"
})
export default class Rem extends Vue {
    public rem: number = 14;

    public setRem() {
        this.rem = parseFloat(window.getComputedStyle(document.documentElement)["fontSize"]);
    }

    public mounted() {
        this.setRem();
        addEventListener("resize", this.setRem);
    }

    public beforeDestroy() {
        removeEventListener("resize", this.setRem);
    }

    public remToPx(n: number): string {
        return n * this.rem + "px";
    }
}
