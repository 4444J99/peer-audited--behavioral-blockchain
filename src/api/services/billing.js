"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPEAL_FEE_AMOUNT = exports.TICKET_PRICE_BASE = exports.MONTHLY_SUBSCRIPTION_PRICE = void 0;
exports.processIAP = processIAP;
exports.MONTHLY_SUBSCRIPTION_PRICE = 14.99;
exports.TICKET_PRICE_BASE = 4.99;
exports.APPEAL_FEE_AMOUNT = 5.00;
async function processIAP(pool, stripe, ledger, truthLog, userId, contractId) {
    const userResult = await pool.query('SELECT stripe_customer_id, account_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        throw new Error(`User ${userId} not found`);
    }
    const { stripe_customer_id, account_id } = userResult.rows[0];
    if (!stripe_customer_id) {
        throw new Error('User has no payment method on file');
    }
    const paymentIntent = await stripe.holdStake(stripe_customer_id, exports.TICKET_PRICE_BASE, contractId);
    await stripe.captureStake(paymentIntent.id);
    if (account_id) {
        const revenueResult = await pool.query(`SELECT id FROM accounts WHERE name = 'SYSTEM_REVENUE' LIMIT 1`);
        if (revenueResult.rows.length > 0) {
            await ledger.recordTransaction(account_id, revenueResult.rows[0].id, exports.TICKET_PRICE_BASE, contractId, { type: 'TICKET_PURCHASE', userId });
        }
    }
    await truthLog.appendEvent('TICKET_PURCHASED', {
        userId,
        contractId,
        amount: exports.TICKET_PRICE_BASE,
        paymentIntentId: paymentIntent.id,
    });
    return { paymentIntentId: paymentIntent.id, amount: exports.TICKET_PRICE_BASE };
}
//# sourceMappingURL=billing.js.map