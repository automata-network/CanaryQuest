import connector from "../utils/connector";
import { ApiPromise } from "@polkadot/api";
import config from "config";

let api: ApiPromise;
export async function getMainNode() {
    if (!api) api = await connector(process.env.MAIN_NODE || config.get("MAIN_NODE"));
    return api;
}
