import type { Order } from "../../domain/entities/order.js";

export class OrderResponseMapper {
    static toResponse(order: Order) {
        return {
            id: order.id,
            customerId: order.customerId,
            cartId: order.cartId,
            status: order.status,
            subtotalAmount: order.subtotalAmount,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            promotionId: order.promotionId,
            couponCode: order.couponCode,
            discountType: order.discountType,
            discountValue: order.discountValue,
            currency: order.currency,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                productName: item.productName,
                sku: item.sku,
                unitPrice: item.unitPrice,
                currency: item.currency,
                quantity: item.quantity,
                subtotal: item.subtotal
            }))
        };
    }
}