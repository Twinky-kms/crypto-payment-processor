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
    BTC = "BTC",
    DOGE = "DOGE"
}

class WalletManager {
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

function generateAddress(currency: CurrencyTypes) {
    switch (currency) {
        case CurrencyTypes.BTC: {
            return "1btcaddress0"
        }
        case CurrencyTypes.DOGE: {
            return "Dogeaddress0"
        }
    }
}

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
    start() {
        setInterval(() => {
            allPayments.forEach(element => {
                const payment: PaymentManager = new PaymentManager("", element.paymentCreator, element.paymentAmount, element.paymentCurrency, "")
                paymentsToWatch.forEach(element => {
                    if (element.paymentId == payment.paymentId) {
                        console.log("match")
                    }
                })
            })
        }, 1e4)
    }
}

const monitor = new PaymentMonitor;
monitor.start();

const generatedPayment: PaymentManager = new PaymentManager("", "user33133", 34949 * 1e8, CurrencyTypes.DOGE, "")
const generatedPayment2: PaymentManager = new PaymentManager("", "user25513", 41556 * 1e8, CurrencyTypes.DOGE, "")
const generatedPayment3: PaymentManager = new PaymentManager("1234fff", "user143433", 345155 * 1e8, CurrencyTypes.DOGE, "d111rrr222")

paymentsToWatch.push(generatedPayment.getPayment())
allPayments.push(generatedPayment)
paymentsToWatch.push(generatedPayment2.getPayment())
allPayments.push(generatedPayment2)
paymentsToWatch.push(generatedPayment3.getPayment())
allPayments.push(generatedPayment3)

