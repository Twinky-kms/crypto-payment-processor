import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs'
import * as request from "request"
import { Database } from 'sqlite3';

//databse
class DatabaseHandler {
    private db: Database;

    constructor() {
        const dbPath = 'payment-processor.db';
        if (existsSync(dbPath)) {
            this.db = new Database(dbPath, (err) => {
                if (err) {
                    console.error('Could not connect to database', err);
                } else {
                    console.log('Connected to the SQLite database.');
                    this.setupDatabase();
                }
            });
        } else {
            console.log('Database does not exist. Please create the database file before connecting.');
        }
    }

    private setupDatabase(): void {
        const sql = `
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paymentId TEXT NOT NULL UNIQUE,
                paymentCreator TEXT NOT NULL,
                paymentAmount INTEGER NOT NULL,
                paymentCurrency INTEGER NOT NULL,
                paymentDestinationAddress TEXT NOT NULL
            );
        `;
        this.db.exec(sql, (err) => {
            if (err) {
                console.error("Error creating tables", err);
            } else {
                console.log("Tables created or already exist");
            }
        });
    }

    public insertPayment(payment: PaymentManager): void {
        const sql = `INSERT INTO payments (paymentId, paymentCreator, paymentAmount, paymentCurrency, paymentDestinationAddress) VALUES (?, ?, ?, ?, ?)`;
        this.db.run(sql, [payment.paymentId, payment.paymentCreator, payment.paymentAmount, payment.paymentCurrency, payment.paymentDestinationAddress], (err) => {
            if (err) {
                console.error('Error inserting payment', err);
            } else {
                console.log('Payment inserted successfully');
            }
        });
    }

    public close(): void {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing the database', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

//tranactions
enum TxState {
    EMPTY,
    UNCONFIRMED,
    CONFIRMD
}

interface Transaction {
    hash: string,
    submittedHeight: number,
    state: TxState
}

//wallets
const MINIMUM_CONFIRMATIONS = 120;

enum CurrencyTypes {
    BTC,
    DINGO
}

enum WalletInfo {
    ".bitcoin",
    ".dingocoin"
}

const enabledCoins: Array<CurrencyTypes> = [CurrencyTypes.BTC, CurrencyTypes.DINGO];

class WalletManager {
    private callRpc<T>(method: string, params: Array<string | number | Boolean>, walletName: CurrencyTypes): Promise<T> {
        const cookie = this.getCookie(walletName);
        const options = {
            url: "http://localhost:" + 3333, //TODO: fix port
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
                        .replace(/"(amount|value)":\s*(\d+)\.((\d*?[1-9])0*),/g, '"$1":"$2\.$4",')
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

    private getCookieLocation(targetWallet: CurrencyTypes) {
        return "~/coin/.cookie".replace("~", homedir()).replace("coin", WalletInfo[Object.keys(CurrencyTypes).indexOf(targetWallet.toFixed())])
    }

    private getCookie(targetWallet: CurrencyTypes) {
        const data = readFileSync(this.getCookieLocation(targetWallet), 'utf-8').split(':');
        return { user: data[0], password: data[1] };
    }

    public async generateAddress(currency: CurrencyTypes): Promise<string | null> {
        switch (currency) {
            case CurrencyTypes.BTC: {
                return this.callRpc<string>("getnewaddress", [], CurrencyTypes.DINGO)
                    .then(address => address)
                    .catch(error => {
                        console.error("Failed to generate DINGO address: ", error);
                        return null;
                    });
            }
            case CurrencyTypes.DINGO: {
                return this.callRpc<string>("getnewaddress", [], CurrencyTypes.DINGO)
                    .then(address => address)
                    .catch(error => {
                        console.error("Failed to generate DINGO address: ", error);
                        return null;
                    });
            }
        }
    }

    public checkPaymentState(currency: CurrencyTypes, payment: PaymentManager, confirmations: number): Boolean {
        this.callRpc<number>("getbalance", [payment.paymentDestinationAddress, confirmations], currency)
            .then(addressBalance => {
                console.log(addressBalance)
                if (addressBalance >= payment.paymentAmount) {
                    return true
                } else {
                    return false
                }
            }).catch(error => {
                console.error("failed to check address balance for: " + payment.paymentDestinationAddress)
                console.error(error)
            })
        return false;
    }

    public checkPaymentAddressBalance(currency: CurrencyTypes, payment: PaymentManager, confirmations: number): number {
        let response: number = -1;
        this.callRpc<number>("getbalance", [payment.paymentDestinationAddress, confirmations], currency)
            .then(addressBalance => {
                response = addressBalance;
            }).catch(error => {
                console.error("failed to check address balance for: " + payment.paymentDestinationAddress)
                console.error(error)
            })
        return response;
    }
}

const walletManager = new WalletManager();

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
    paymentDestinationAddress: string;
    paymentTransaction: Transaction = {
        hash: "0x0",
        submittedHeight: -1,
        state: TxState.EMPTY
    };


    walletManager: WalletManager;

    constructor(paymentId: string, paymentCreator: string, paymentAmount: number, paymentCurrency: CurrencyTypes, paymentDestinationAddress: string) {
        this.paymentId = paymentId == "" ? Math.random().toString(16).slice(2) : paymentId;
        this.paymentCreator = paymentCreator;
        this.paymentAmount = paymentAmount;
        this.paymentCurrency = paymentCurrency;
        this.initPaymentDestinationAddress(paymentDestinationAddress, paymentCurrency);
        this.walletManager = new WalletManager();
    }

    private async initPaymentDestinationAddress(paymentDestinationAddress: string, paymentCurrency: CurrencyTypes) {
        if (paymentDestinationAddress === "") {
            const generatedAddress = await walletManager.generateAddress(paymentCurrency);
            this.paymentDestinationAddress = generatedAddress ? generatedAddress : "Address generation failed";
        } else {
            this.paymentDestinationAddress = paymentDestinationAddress;
        }
    }

    public print() {
        return this;
    }

    public getPayment() {
        const payment: Payment = {
            paymentId: this.paymentId
        }
        return payment;
    }

    public updateTransaction(tx: Transaction) {
        this.paymentTransaction = tx;
    }
}


class PaymentMonitor {
    public findPayment(targetPaymentId: string) {
        let foundMatch: Boolean = false;
        let match: PaymentManager;
        allPayments.forEach(payment => {
            const paymentId: string = payment.paymentId;
            if (paymentId == targetPaymentId) {
                foundMatch = true;
                match = payment;
            }
        })
        if (foundMatch) {
            return match;
        }
        return "No payment found."
    }

    public checkPayments() {
        paymentsToWatch.forEach(paymentElement => {
            const paymentId: string = paymentElement.paymentId
            allPayments.forEach(allPaymentsElement => {
                const payment: PaymentManager = new PaymentManager(allPaymentsElement.paymentId, allPaymentsElement.paymentCreator, allPaymentsElement.paymentAmount, allPaymentsElement.paymentCurrency, allPaymentsElement.paymentDestinationAddress)
                if (paymentId == payment.paymentId) {
                    console.log("match")
                }
            })
        })
    }

    public start() {
        this.checkPayments();
        setInterval(this.checkPayments, 1e4)
    }
}

// const wm: WalletManager = new WalletManager();
// wm.generateAddress(CurrencyTypes.DINGO).then(address => {
//     console.log(address)
// })
const generatedPayment: PaymentManager = new PaymentManager("", "user33133", 34949 * 1e8, CurrencyTypes.DINGO, "DCBjbDFqn7HxjnW6sAEyiGS1gsaRzZF5wU");
// const generatedPayment2: PaymentManager = new PaymentManager("", "user25513", 41556 * 1e8, CurrencyTypes.DINGO, "")
// const generatedPayment3: PaymentManager = new PaymentManager("1234fff", "user143433", 345155 * 1e8, CurrencyTypes.DINGO, "d111rrr222")

paymentsToWatch.push(generatedPayment.getPayment())
allPayments.push(generatedPayment)
// paymentsToWatch.push(generatedPayment2.getPayment())
// allPayments.push(generatedPayment2)
// paymentsToWatch.push(generatedPayment3.getPayment())
// allPayments.push(generatedPayment3)

//start services

const monitor = new PaymentMonitor;
monitor.start();

//find payment test
const payment = monitor.findPayment("1234fff");

console.log("::::")
console.log(payment)
