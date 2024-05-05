import { homedir } from 'os';
import { readFileSync } from 'fs';
// import * as request from 'request';
const request = require("request")
import { CurrencyTypes } from './types/CurrencyTypes';
import { PaymentManager } from '../payments/PaymentManager';

export class WalletManager {
    private callRpc<T>(method: string, params: Array<string | number | boolean>, walletName: CurrencyTypes): Promise<T> {
        const cookie = this.getCookie(walletName);
        const options = {
            url: `http://localhost:${3333}`, // Port fixed as a template literal
            method: "post",
            headers: { "content-type": "text/plain" },
            auth: { user: cookie.user, pass: cookie.password },
            body: JSON.stringify({ "jsonrpc": "1.0", "method": method, "params": params })
        };

        return new Promise<T>((resolve, reject) => {
            request(options, (err, resp, body) => {
                if (err) {
                    return reject(err);
                } else {
                    const r = JSON.parse(body
                        .replace(/"(amount|value)":\s*(\d+)\.((\d*?[1-9])0*),/g, '"$1":"$2.$4",')
                        .replace(/"(amount|value)":\s*(\d+)\.0+,/g, '"$1":"$2",'));
                    if (r.error) {
                        reject(r.error.message);
                    } else {
                        resolve(r.result);
                    }
                }
            });
        });
    }

    private getCookieLocation(targetWallet: CurrencyTypes): string {
        const WalletInfo = {
            [CurrencyTypes.BTC]: 'bitcoin',
            [CurrencyTypes.DINGO]: 'dingocoin'
        };
        return `${homedir()}/${WalletInfo[targetWallet]}/.cookie`;
    }

    private getCookie(targetWallet: CurrencyTypes): { user: string; password: string } {
        const data = readFileSync(this.getCookieLocation(targetWallet), 'utf-8').split(':');
        return { user: data[0], password: data[1] };
    }

    public async generateAddress(currency: CurrencyTypes): Promise<string | null> {
        try {
            const address = await this.callRpc<string>("getnewaddress", [], currency);
            return address;
        } catch (error) {
            console.error(`Failed to generate address for ${CurrencyTypes[currency]}: `, error);
            return null;
        }
    }

    public async checkPaymentState(currency: CurrencyTypes, payment: PaymentManager, confirmations: number): Promise<boolean> {
        try {
            const addressBalance = await this.callRpc<number>("getbalance", [payment.paymentDestinationAddress, confirmations], currency);
            return addressBalance >= payment.paymentAmount;
        } catch (error) {
            console.error(`Failed to check address balance for: ${payment.paymentDestinationAddress}`, error);
            return false;
        }
    }

    public async checkPaymentAddressBalance(currency: CurrencyTypes, payment: PaymentManager, confirmations: number): Promise<number> {
        try {
            const addressBalance = await this.callRpc<number>("getbalance", [payment.paymentDestinationAddress, confirmations], currency);
            return addressBalance;
        } catch (error) {
            console.error(`Failed to check address balance for: ${payment.paymentDestinationAddress}`, error);
            return -1;
        }
    }
}
