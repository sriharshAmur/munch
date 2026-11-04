import { DetailSchema } from './normalize';
export async function checkRaw() {
  const counts: Record<string, number> = { orders: 0 };
  const count = (name: string, condition: boolean) => {
    if (condition) counts[name] = (counts[name] ?? 0) + 1;
  };
  const c = (n: number) => Math.round(n * 100);
  for (const name of new Bun.Glob('*.json').scanSync(
    'data/raw/thuisbezorgd/orders',
  )) {
    const d = DetailSchema.parse(
        await Bun.file(`data/raw/thuisbezorgd/orders/${name}`).json(),
      ),
      t = d.payment.totals;
    counts.orders++;
    const subtotal = c(t.subtotal),
      fees = c(t.fees),
      splitFees = c(d.payment.fees.delivery) + c(d.payment.fees.serviceCharge),
      discount = c(t.discounts),
      tips = c(t.tips),
      vouchers = c(t.vouchers),
      complimentary = c(t.complimentary),
      credits = c(t.accountCredits),
      toPay = c(t.totalToPay),
      paid = c(t.totalPaid);
    count('split fees differ from aggregate', splitFees !== fees);
    count('negative discounts', discount < 0);
    count('nonzero vouchers', vouchers !== 0);
    count('nonzero complimentary', complimentary !== 0);
    count('nonzero credits', credits !== 0);
    count('paid differs from to-pay', paid !== toPay);
    count('nonzero adjustments', t.adjustments !== 0);
    count('negative adjustments', t.adjustments < 0);
    count('nonzero taxes', t.taxes !== 0);
    const candidates = {
      'subtract discounts and add adjustments':
        subtotal + fees - discount + c(t.adjustments) + tips,
      'subtract discounts and subtract adjustments':
        subtotal + fees - discount - c(t.adjustments) + tips,
      'add vouchers and adjustments':
        subtotal + fees - discount + vouchers + c(t.adjustments) + tips,
      'subtract vouchers add adjustments':
        subtotal + fees - discount - vouchers + c(t.adjustments) + tips,
      'add taxes': subtotal + fees - discount + c(t.taxes) + tips,
      'subtract discounts, with tips': subtotal + fees - discount + tips,
      'subtract discounts, without tips': subtotal + fees - discount,
      'add discounts, with tips': subtotal + fees + discount + tips,
      'add discounts, without tips': subtotal + fees + discount,
      'subtract discounts and vouchers, with tips':
        subtotal + fees - discount - vouchers + tips,
      'subtract discounts and credits, with tips':
        subtotal + fees - discount - credits + tips,
      'add discounts and vouchers, with tips':
        subtotal + fees + discount + vouchers + tips,
    };
    for (const [label, total] of Object.entries(candidates)) {
      count(`${label}: to-pay mismatches`, total !== toPay);
      count(`${label}: paid mismatches`, total !== paid);
    }
  }
  process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
}
