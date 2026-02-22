/**
 * Billing & Monetization Logic
 * 
 * Tasks for AI Engineer:
 * 1. Implement 'processIAP(userId, challengeId)': Handle one-off ticket purchases.
 * 2. Implement 'calculateB2BBill(employerId)': Consumption-based billing logic (MA-05).
 */

export const MONTHLY_SUBSCRIPTION_PRICE = 14.99;
export const TICKET_PRICE_BASE = 4.99;

/**
 * PI-01: Appeal Friction Fee
 * Charged to users who appeal a Fury audit rejection.
 */
export const APPEAL_FEE_AMOUNT = 5.00;
