import { hexToU8a, isHex } from "@polkadot/util";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";

export default function validAddress(address: string) {
    if (!(address.startsWith("a7"))) return false;
    if (isHex(address)) return false;
    try {
        // encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
        encodeAddress(decodeAddress(address));
        return true;
    } catch (error) {
        return false;
    }
}
