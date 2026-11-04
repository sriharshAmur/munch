import { z } from 'zod';
const AddressSchema = z.object({
  consumer: z.object({
    deliveryAddress: z.object({
      addressLines: z.array(z.string()).optional().default([]),
      postalCode: z.string(),
      city: z.string(),
    }),
  }),
});
export function privateHome(input: unknown) {
  const parsed = AddressSchema.safeParse(input);
  if (!parsed.success)
    throw Error('The saved delivery area is missing required fields.');
  const a = parsed.data.consumer.deliveryAddress,
    street = a.addressLines[0]?.trim().replace(/\s+/g, ' ') ?? '',
    postcode = a.postalCode.replace(/\D/g, '').slice(0, 4),
    canonical = [
      a.city.trim().toLocaleLowerCase('nl-NL'),
      postcode,
      street.normalize('NFC').toLocaleLowerCase('nl-NL'),
    ].join('|');
  return {
    key: `home-${new Bun.CryptoHasher('sha256').update(canonical).digest('hex').slice(0, 16)}`,
    label: /\p{L}/u.test(street) && /\d/.test(street) ? street : null,
  };
}
