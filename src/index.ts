import { DatabaseHandler } from './database/DatabaseHandler';
import { PaymentManager } from './payments/PaymentManager';
import { PaymentMonitor } from './payments/PaymentMonitor'
import { CurrencyTypes } from './wallet/types/CurrencyTypes';
import { TxState } from './payments/types/TxState';

async function main() {
    const databaseHandler = new DatabaseHandler();
    const paymentMonitor = new PaymentMonitor();

    const newPayment = new PaymentManager("", "user33133", 34949 * 1e8, CurrencyTypes.DINGO, "", TxState.UNCONFIRMED);
    await databaseHandler.insertPayment(newPayment);

    // Start monitoring payments
    paymentMonitor.start();
}

main().catch(console.error);
