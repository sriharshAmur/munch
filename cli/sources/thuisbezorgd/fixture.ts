export const fakeDetail = {
  id: 'made-up-order',
  information: { createdAt: '2026-03-01T22:30:00Z', isForDelivery: true },
  basket: {
    currencyCode: 'EUR',
    groupSummary: null,
    summary: {
      items: [
        { name: 'Imaginary noodles', quantity: 2, price: 24, unitPrice: 12 },
      ],
    },
  },
  consumer: {
    id: 'fake-consumer',
    name: 'Not retained',
    email: 'nobody@example.invalid',
    deliveryAddress: {
      city: 'Demo city',
      postalCode: '0001 ZZ',
      addressLines: ['Not retained'],
    },
  },
  payment: {
    totals: {
      subtotal: 24,
      fees: 2,
      discounts: 0,
      tips: 1,
      vouchers: 0,
      accountCredits: 0,
      complimentary: 0,
      totalToPay: 27,
      totalPaid: 27,
    },
    fees: { delivery: 1.5, serviceCharge: 0.5 },
    payments: [{ displayName: 'Demo payment', value: 27 }],
  },
  restaurant: {
    id: 'fake-place',
    displayName: 'Imaginary Noodle Attic',
    cuisines: [{ name: 'Thai', rank: 1 }],
  },
  status: { value: 'delivered', finishedAt: null },
};
