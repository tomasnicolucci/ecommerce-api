import { ApprovePayment } from "./application/use-cases/payments/approve-payment.js";
import { GetPaymentById } from "./application/use-cases/payments/get-payment-by-id.js";
import { RejectPayment } from "./application/use-cases/payments/reject-payment.js";
import { PostgresPaymentRepository } from "./infrastructure/persistence/postgres/repositories/postgres-payment-repository.js";
import { PaymentController } from "./presentation/controllers/payment-controller.js";

const paymentRepository = new PostgresPaymentRepository();
const getPaymentById = new GetPaymentById(paymentRepository);
const approvePayment = new ApprovePayment(paymentRepository);
const rejectPayment = new RejectPayment(paymentRepository);

export const paymentController = new PaymentController(getPaymentById, approvePayment, rejectPayment);