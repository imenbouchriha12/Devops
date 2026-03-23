import { z } from 'zod';
import { AccountType } from '../enums/account-type.enum';

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.nativeEnum(AccountType),
  bank_name: z.string().max(100).optional(),
  rib: z.string().length(23).optional(),
  opening_balance: z.number().min(0).default(0),
  currency: z.string().default('TND'),
  is_default: z.boolean().default(false),
});

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
