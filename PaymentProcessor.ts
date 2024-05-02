let allPayments: Array<PaymentManager> = [];
let paymentsToWatch: Array<Payment> = [];

enum TxState {
    CONFIRMED,
    UNCONFIRMED,
    ABORTED, // user can abort a tx on some edge cases 
    REVERTED, //in cases of reorgs.
    EMPTY //if the payment tx hasn't been detected yet.
}

enum CurrencyTypes {
    BTC = "BTC",
    DOGE = "DOGE"
}

interface Transaction {
    hash: string,
    submittedHeight: number,
    state: TxState
}

interface Payment {
    paymentId: string,
}

function generateAddress(currency: CurrencyTypes) {
    switch(currency) {
        case CurrencyTypes.BTC: {
            return "1btcaddress0"
        }
        case CurrencyTypes.DOGE: {
            return "Dogeaddress0"
        }
    }
}

class PaymentManager {
    paymentId: string;
    paymentCreator: string;
    paymentAmount: number;
    paymentCurrency: CurrencyTypes;
    paymentDestationAddress: string; // this should be a address check at some point instead of string. although, it _should_ never be invalid.
    paymentTransaction: Transaction = {
        hash: "0x0",
        submittedHeight: -1,
        state: TxState.EMPTY
    };

    constructor(paymentCreator: string, paymentAmount: number, paymentCurrency: CurrencyTypes) {
        this.paymentId = Math.random().toString(16).slice(2);
        this.paymentCreator = paymentCreator;
        this.paymentAmount = paymentAmount;
        this.paymentCurrency = paymentCurrency;
        this.paymentDestationAddress = generateAddress(paymentCurrency);
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
}

const generatedPayment: PaymentManager = new PaymentManager("user33133", 34949 * 1e8, CurrencyTypes.DOGE)

paymentsToWatch.push(generatedPayment.getPayment())
allPayments.push(generatedPayment)

paymentsToWatch.forEach(element => {
    let paymentId = element.paymentId;
    allPayments.forEach(element => {
        if(element.paymentId == paymentId) {
            console.log("match")
        }
    })
})
