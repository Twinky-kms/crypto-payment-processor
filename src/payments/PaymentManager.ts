import { WalletManager } from '../wallet/WalletManager'; // Assuming the correct path
import { CurrencyTypes } from '../wallet/types/CurrencyTypes'; // Assuming the correct path
import { TxState } from './types/TxState'; // Assuming the correct path
import { Payment } from './types/Payment'; // Assuming the correct path

export class PaymentManager {
    public paymentId: string;
    public paymentCreator: string;
    public paymentAmount: number;
    public paymentCurrency: CurrencyTypes;
    public paymentDestinationAddress: string;
    public txState: TxState;
    private walletManager: WalletManager;

    constructor(paymentId: string, paymentCreator: string, paymentAmount: number, paymentCurrency: CurrencyTypes, paymentDestinationAddress: string, txState: TxState) {
        this.paymentId = paymentId === "" ? Math.random().toString(16).slice(2) : paymentId;
        this.paymentCreator = paymentCreator;
        this.paymentAmount = paymentAmount;
        this.paymentCurrency = paymentCurrency;
        this.initPaymentDestinationAddress(paymentDestinationAddress, paymentCurrency);
        this.txState = txState;
        this.walletManager = new WalletManager();
    }

    private async initPaymentDestinationAddress(paymentDestinationAddress: string, paymentCurrency: CurrencyTypes) {
        if (paymentDestinationAddress === "") {
            const generatedAddress = await this.walletManager.generateAddress(paymentCurrency);
            this.paymentDestinationAddress = generatedAddress ? generatedAddress : "Address generation failed";
        } else {
            this.paymentDestinationAddress = paymentDestinationAddress;
        }
    }

    public print() {
        return this;
    }

    public getPayment(): Payment {
        const payment: Payment = {
            paymentId: this.paymentId
        }
        return payment;
    }
}