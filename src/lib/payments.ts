import 'server-only';
import type { PaymentMethod } from './types';

/**
 * Payment methods shown at checkout.
 * Cash / card on delivery / installment request always work.
 * Click, Payme and Uzum appear automatically once their merchant keys are set in the environment
 * (their confirmation callbacks must be implemented in /api/payments/* before enabling — see README).
 */
export function enabledPayments(): PaymentMethod[] {
  const list: PaymentMethod[] = ['cash', 'card'];
  if (process.env.CLICK_SERVICE_ID && process.env.CLICK_MERCHANT_ID && process.env.CLICK_SECRET_KEY) list.push('click');
  if (process.env.PAYME_MERCHANT_ID && process.env.PAYME_KEY) list.push('payme');
  if (process.env.UZUM_MERCHANT_ID) list.push('uzum');
  list.push('installment');
  return list;
}

/** Redirect URL to the payment provider's checkout page (online methods only). */
export function paymentRedirectUrl(method: PaymentMethod, orderId: string, amountUzs: number, returnUrl: string): string | null {
  if (method === 'click' && process.env.CLICK_SERVICE_ID && process.env.CLICK_MERCHANT_ID) {
    const p = new URLSearchParams({
      service_id: process.env.CLICK_SERVICE_ID,
      merchant_id: process.env.CLICK_MERCHANT_ID,
      amount: amountUzs.toFixed(2),
      transaction_param: orderId,
      return_url: returnUrl,
    });
    return `https://my.click.uz/services/pay?${p}`;
  }
  if (method === 'payme' && process.env.PAYME_MERCHANT_ID) {
    const tiyin = Math.round(amountUzs * 100);
    const params = `m=${process.env.PAYME_MERCHANT_ID};ac.order_id=${orderId};a=${tiyin};c=${returnUrl}`;
    return `https://checkout.paycom.uz/${Buffer.from(params).toString('base64')}`;
  }
  return null;
}
