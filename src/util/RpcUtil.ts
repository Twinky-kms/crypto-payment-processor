import * as request from "request";
import { homedir } from 'os';
import { readFileSync } from 'fs';
import { CurrencyTypes } from '../wallet/types/CurrencyTypes';
import { WalletInfo } from '../wallet/types/WalletInfo';

interface RpcOptions {
    method: string;
    params: Array<string | number | boolean>;
    walletName: CurrencyTypes;
}

interface Cookie {
    user: string;
    password: string;
}

export class RpcUtil {
    private static getCookieLocation(walletName: CurrencyTypes): string {
        return `${homedir()}/.coin/.cookie`.replace("coin", WalletInfo[walletName]);
    }

    private static getCookie(walletName: CurrencyTypes): Cookie {
        const cookiePath = this.getCookieLocation(walletName);
        const data = readFileSync(cookiePath, 'utf-8').split(':');
        return { user: data[0], password: data[1] };
    }

    public static callRpc<T>(options: RpcOptions): Promise<T> {
        const { method, params, walletName } = options;
        const cookie = this.getCookie(walletName);
        const requestOptions = {
            url: `http://localhost:3333`, // This should be configured properly
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            auth: { user: cookie.user, pass: cookie.password },
            body: JSON.stringify({ "jsonrpc": "1.0", "method": method, "params": params })
        };

        return new Promise<T>((resolve, reject) => {
            request(requestOptions, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        const parsedBody = JSON.parse(body);
                        if (parsedBody.error) {
                            reject(new Error(parsedBody.error.message));
                        } else {
                            resolve(parsedBody.result);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                }
            });
        });
    }
}