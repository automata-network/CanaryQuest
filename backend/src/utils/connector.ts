import { ApiPromise, WsProvider } from "@polkadot/api";
import type { OverrideBundleType, OverrideBundleDefinition } from "@polkadot/types/types";
import automataContextFree from '../spec/automata-contextfree';
import automataFiniteState from '../spec/automata-finitestate';
import { logger } from "../logger";

export default function connector(endpoint: string, maxRetryTime: number = Infinity, onFail?: Function) {
    const RETRY_DELAY = 2500;
    const spec: Record<string, OverrideBundleDefinition> = {
        contextfree: automataContextFree,
        finitestate: automataFiniteState
    }
    const typesBundle: OverrideBundleType = {spec};

    const wsProvider = new WsProvider(endpoint, maxRetryTime === Infinity ? RETRY_DELAY : 0);
    if (maxRetryTime === Infinity) {
        return ApiPromise.create({provider: wsProvider, typesBundle});
    }

    // If maxRetryTime set, connect chain manually
    const api = new ApiPromise({provider: wsProvider, typesBundle});
    let retryTime = 0;
    const tryConnect = () => {
        return new Promise<void>(async (resolve, reject) => {
            if (retryTime < maxRetryTime) {
                await api.connect();
                await api.isReadyOrError.then(() => {
                    resolve();
                }).catch(() => {
                    retryTime++;
                    setTimeout(() => {
                        tryConnect().catch(() => reject());
                    }, RETRY_DELAY);
                })
            } else {
                logger.error(`Disconnected from ${endpoint} for ${maxRetryTime} times retry failed.`);
                if (onFail) onFail();
                reject();
            }
        });
    }

    return new Promise<ApiPromise | null>(async (resolve) => {
        await tryConnect().then(() => resolve(api)).catch(() => resolve(null));
    });
}
