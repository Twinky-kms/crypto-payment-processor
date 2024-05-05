import { DatabaseHandler } from '../database/DatabaseHandler';
import { PaymentManager } from './PaymentManager';

export class PaymentMonitor {
    public async findPayment(targetPaymentId: string, databaseHandler: DatabaseHandler): Promise<PaymentManager | string> {
        const payment = await databaseHandler.fetchPayment(targetPaymentId);
        if (payment) {
            return payment;
        }
        return "No payment found.";
    }

    public async checkPayments(databaseHandler: DatabaseHandler) {
        const allPayments = await databaseHandler.fetchAllPayments();
        const paymentsToWatch = await databaseHandler.fetchUnconfirmedPayments();
        paymentsToWatch.forEach(paymentElement => {
            console.log(paymentElement);
            const paymentId: string = paymentElement.paymentId;
            allPayments.forEach(allPaymentsElement => {
                if (paymentId === allPaymentsElement.paymentId) {
                    console.log("match");
                }
            });
        });
    }

    public start() {
        // this.checkPayments();
        setInterval(async () => {
            const databaseHandler: DatabaseHandler = new DatabaseHandler();
            await this.checkPayments(databaseHandler);
        }, 10000); // 1e4 replaced with 10000 for clarity
    }
}
