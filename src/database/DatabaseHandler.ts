import { existsSync } from 'fs'
import { Database } from 'sqlite3';
import { PaymentManager } from "../payments/PaymentManager"
import { PaymentRow } from "./types/PaymentRow"
import { TxState } from '../payments/types/TxState';

export class DatabaseHandler {
    private db: Database;

    constructor() {
        const dbPath = 'payment-processor.db';
        if (!existsSync(dbPath)) {
            console.log('Database file does not exist. Creating new database file.');
            const fs = require('fs');
            fs.writeFileSync(dbPath, '');
        }
        this.db = new Database(dbPath, (err) => {
            if (err) {
                console.error('Could not connect to database', err);
            } else {
                // console.log('Connected to the SQLite database.');
                this.setupDatabase();
            }
        });
    }

    setupDatabase(): void {
        const sql = `
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paymentId TEXT NOT NULL UNIQUE,
                paymentCreator TEXT NOT NULL,
                paymentAmount INTEGER NOT NULL,
                paymentCurrency INTEGER NOT NULL,
                paymentDestinationAddress TEXT NOT NULL,
                txState TEXT NOT NULL
            );
        `;
        this.db.exec(sql, (err) => {
            if (err) {
                console.error("Error creating tables", err);
            } else {
                // console.log("Tables created or already exist");
            }
        });
    }

    public insertPayment(payment: PaymentManager): void {
        const sql = `INSERT INTO payments (paymentId, paymentCreator, paymentAmount, paymentCurrency, paymentDestinationAddress, txState) VALUES (?, ?, ?, ?, ?, ?)`;
        this.db.run(sql, [payment.paymentId, payment.paymentCreator, payment.paymentAmount, payment.paymentCurrency, payment.paymentDestinationAddress, payment.txState], (err) => {
            if (err) {
                console.error('Error inserting payment', err);
            } else {
                console.log('Payment inserted successfully');
            }
        });
    }

    public fetchPayment(paymentId: string): Promise<PaymentManager | null> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM payments WHERE paymentId = ?`;
            this.db.get(sql, [paymentId], (err, row: PaymentRow) => {
                if (err) {
                    console.error('Error fetching payment', err);
                    reject(err);
                } else if (row) {
                    const payment = new PaymentManager(row.paymentId, row.paymentCreator, row.paymentAmount, row.paymentCurrency, row.paymentDestinationAddress, row.txState);
                    resolve(payment);
                } else {
                    resolve(null);
                }
            });
        });
    }

    public fetchUnconfirmedPayments(): Promise<PaymentManager[]> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM payments WHERE txState = ? OR txState = ?`;
            this.db.all(sql, [TxState.UNCONFIRMED, TxState.EMPTY], (err, rows: PaymentRow[]) => {
                if (err) {
                    console.error('Error fetching unconfirmed payments', err);
                    reject(err);
                } else {
                    const payments = rows.map(row => new PaymentManager(row.paymentId, row.paymentCreator, row.paymentAmount, row.paymentCurrency, row.paymentDestinationAddress, row.txState));
                    resolve(payments);
                }
            });
        });
    }

    public fetchAllPayments(): Promise<PaymentManager[]> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM payments`;
            this.db.all(sql, [], (err, rows: PaymentRow[]) => {
                if (err) {
                    console.error('Error fetching all payments', err);
                    reject(err);
                } else {
                    const payments = rows.map(row => new PaymentManager(row.paymentId, row.paymentCreator, row.paymentAmount, row.paymentCurrency, row.paymentDestinationAddress, row.txState));
                    resolve(payments);
                }
            });
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
const databaseHandler: DatabaseHandler = new DatabaseHandler();

databaseHandler.fetchAllPayments()
    .then(payments => {
        console.log('All payments loaded from database:', payments);
    })
    .catch(err => {
        console.error('Error loading payments from database', err);
    });