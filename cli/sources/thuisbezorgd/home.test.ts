import { test, expect } from 'bun:test';
import { privateHome } from './home';
const input = (street: string) => ({
  consumer: {
    deliveryAddress: {
      addressLines: [street],
      postalCode: '0001 ZZ',
      city: 'Demo town',
    },
  },
});
test('different houses in the same postcode stay separate and keys do not expose the street', () => {
  const a = privateHome(input('Imaginary Lane 12')),
    b = privateHome(input('Imaginary Lane 14'));
  expect(a.key).not.toBe(b.key);
  expect(a.key).not.toContain('Imaginary');
  expect(a.key).toBe(privateHome(input(' imaginary  lane 12 ')).key);
  expect(a.label).toBe('Imaginary Lane 12');
});
