enum TxState {
    CONFIRMED,
    UNCONFIRMED,
    ABORTED, // user can abort a tx on some edge cases 
    REVERTED, //in cases of reorgs.
    EMPTY //if the payment tx hasn't been detected yet.
}

enum CurrencyTypes {
    BTC,
    DINGO
}

interface Transaction {
    hash: string,
    submittedHeight: number,
    state: TxState
}

class Payment {
    paymentId: string;
    paymentCreator: string;
    paymentTransaction: Transaction = {
        hash: "0x0",
        submittedHeight: -1,
        state: TxState.EMPTY
    };

    constructor(paymentId: string, paymentCreator: string) {
        this.paymentId = paymentId;
        this.paymentCreator = paymentCreator;
    }

    printTransaction() {
        console.log(this.paymentTransaction);
        console.log(TxState[this.paymentTransaction.state])
    }

    generatePayment() {

    }
}

class PaymentManager {
    paymentCreator: string;
    paymentAmount: number;
    paymentCurrency: CurrencyTypes;
}

const exampleTx: Transaction = {
    hash: "0x123abcxyz",
    submittedHeight: 100,
    state: TxState.UNCONFIRMED
}

const paymentTest: Payment = new Payment("paymentId:2903924", "user:111333");

paymentTest.printTransaction();