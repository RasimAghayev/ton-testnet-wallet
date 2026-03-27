import { z } from 'zod'
import { securityService } from '@/shared/services/security.service'

export const sendSchema = z.object({
  toAddress: z
    .string()
    .min(1, 'Recipient address is required.')
    .refine((v) => securityService.validateAddress(v), {
      message: 'Invalid TON address format.',
    }),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Amount must be a positive number.',
    })
    .refine((v) => parseFloat(v) >= 0.01, {
      message: 'Minimum amount is 0.01 TON.',
    }),
  comment: z.string().max(128, 'Comment too long.').optional(),
})

export type SendFormData = z.infer<typeof sendSchema>
