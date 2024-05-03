import { homedir } from 'os';
import { readFileSync } from 'fs'
import * as request from "request"
import { Promise } from "es6-promise"

//tranactions
enum TxState {
    CONFIRMED,
    UNCONFIRMED,
    ABORTED, // user can abort a tx on some edge cases 
    REVERTED, //in cases of reorgs.
    EMPTY //if the payment tx hasn't been detected yet.
}

interface Transaction {
    hash: string,
    submittedHeight: number,
    state: TxState
}

//wallets
enum CurrencyTypes {
    BTC,
    DOGE
}

enum WalletInfo {
    ".bitcoin",
    ".dingocoin"
}

const bitcoinCookie: string = "~/.bitcoin/.cookie".replace("~", homedir());
const dingoCookie: string = "~/.dingocoin/.cookie".replace("~", homedir());

const enabledCoins: Array<CurrencyTypes> = [CurrencyTypes.BTC, CurrencyTypes.DOGE];

class WalletManager {
    callRpc(method: string, params: Array<string>, walletName: CurrencyTypes) {
        const cookie = this.getCookie(walletName);
        const options = {
            url: "http://localhost:" + 3333, //TODO: fix port
            method: "post",
            headers: { "content-type": "text/plain" },
            auth: { user: cookie.user, pass: cookie.password },
            body: JSON.stringify({ "jsonrpc": "1.0", "method": method, "params": params })
        };

        return new Promise((resolve, reject) => {
            request(options, (err, resp, body) => {
                if (err) {
                    return reject(err);
                } else {
                    const r = JSON.parse(body
                        .replace(/"(amount|value)":\s*(\d+)\.((\d*?[1-9])0*),/g, '"$1":"$2\.$4",')
                        .replace(/"(amount|value)":\s*(\d+)\.0+,/g, '"$1":"$2",'));
                    if (r.error) {
                        console.log(r.error.message)
                        reject(r.error.message);
                    } else {
                        resolve(r.result);
                    }
                }
            });
        });
    }

    getCookieLocation(targetWallet: CurrencyTypes) {
        return "~/coin/.cookie".replace("~", homedir()).replace("coin", WalletInfo[Object.keys(CurrencyTypes).indexOf(targetWallet.toFixed())])
    }

    getCookie(targetWallet: CurrencyTypes) {
        const data = readFileSync(this.getCookieLocation(targetWallet), 'utf-8').split(':');
        return { user: data[0], password: data[1] };
    }

    generateAddress(currency: CurrencyTypes) {
        switch (currency) {
            case CurrencyTypes.BTC: {
                return "1btcaddress0"
            }
            case CurrencyTypes.DOGE: {
                return "Dogeaddress0"
            }
        }
    }
}

const walletManager = new WalletManager();

walletManager.callRpc("getblockchaininfo", [], CurrencyTypes.DOGE).then(result => console.log(result))

//payments
let allPayments: Array<PaymentManager> = [];
let paymentsToWatch: Array<Payment> = [];

interface Payment {
    paymentId: string,
}

class PaymentManager {
    paymentId: string;
    paymentCreator: string;
    paymentAmount: number;
    paymentCurrency: CurrencyTypes;
    paymentDestationAddress: string;
    paymentTransaction: Transaction = {
        hash: "0x0",
        submittedHeight: -1,
        state: TxState.EMPTY
    };

    constructor(paymentId: string, paymentCreator: string, paymentAmount: number, paymentCurrency: CurrencyTypes, paymentDestinationAddress: string) {
        this.paymentId = paymentId == "" ? Math.random().toString(16).slice(2) : paymentId;
        this.paymentCreator = paymentCreator;
        this.paymentAmount = paymentAmount;
        this.paymentCurrency = paymentCurrency;
        this.paymentDestationAddress = paymentDestinationAddress == "" ? walletManager.generateAddress(paymentCurrency) : paymentDestinationAddress;
    }

    print() {
        return this;
    }

    getPayment() {
        const payment: Payment = {
            paymentId: this.paymentId
        }
        return payment;
    }

    updateTransaction(tx: Transaction) {
        this.paymentTransaction = tx;
    }
}


class PaymentMonitor {

    checkPayments() {
        paymentsToWatch.forEach(paymentElement => {
            const paymentId: string = paymentElement.paymentId
            allPayments.forEach(allPaymentsElement => {
                const payment: PaymentManager = new PaymentManager(allPaymentsElement.paymentId, allPaymentsElement.paymentCreator, allPaymentsElement.paymentAmount, allPaymentsElement.paymentCurrency, allPaymentsElement.paymentDestationAddress)
                if (paymentId == payment.paymentId) {
                    console.log("match")
                }
            })
        })
    }

    start() {
        this.checkPayments();
        setInterval(this.checkPayments, 1e4)
    }
}

const generatedPayment: PaymentManager = new PaymentManager("", "user33133", 34949 * 1e8, CurrencyTypes.DOGE, "")
const generatedPayment2: PaymentManager = new PaymentManager("", "user25513", 41556 * 1e8, CurrencyTypes.DOGE, "")
const generatedPayment3: PaymentManager = new PaymentManager("1234fff", "user143433", 345155 * 1e8, CurrencyTypes.DOGE, "d111rrr222")

paymentsToWatch.push(generatedPayment.getPayment())
allPayments.push(generatedPayment)
paymentsToWatch.push(generatedPayment2.getPayment())
allPayments.push(generatedPayment2)
paymentsToWatch.push(generatedPayment3.getPayment())
allPayments.push(generatedPayment3)

//start services

const monitor = new PaymentMonitor;
monitor.start();

