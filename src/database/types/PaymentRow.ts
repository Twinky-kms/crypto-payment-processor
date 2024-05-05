import { TxState } from "../../payments/types/TxState";

export interface PaymentRow {
    paymentId: string;
    paymentCreator: string;
    paymentAmount: number;
    paymentCurrency: number;
    paymentDestinationAddress: string;
    txState: TxState;
}