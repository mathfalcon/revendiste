import {isValid, parse} from 'date-fns';
import {z} from 'zod';

export const defaultCreateSettlementFormValues = {
  externalSettlementId: '',
  settlementDate: '',
  settlementTime: '12:00',
  totalAmount: '',
  currency: 'UYU' as const,
  paymentProvider: 'dlocal' as const,
};

export const createSettlementFormSchema = z
  .object({
    externalSettlementId: z.string().min(1, 'El ID externo es requerido'),
    settlementDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elegí una fecha'),
    settlementTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
    totalAmount: z
      .string()
      .min(1, 'El monto es requerido')
      .refine(v => /^\d+(\.\d{1,2})?$/.test(v), {
        message: 'Usá hasta 2 decimales (ej. 1.234,56)',
      })
      .refine(v => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0;
      }, {
        message: 'El monto debe ser mayor a 0',
      }),
    currency: z.enum(['UYU', 'USD']),
    paymentProvider: z
      .enum(['dlocal', 'mercadopago', 'paypal', 'stripe'])
      .optional(),
  })
  .refine(
    data => {
      const dt = parse(
        `${data.settlementDate}T${data.settlementTime}`,
        "yyyy-MM-dd'T'HH:mm",
        new Date(),
      );
      if (!isValid(dt)) return true;
      return dt.getTime() <= Date.now();
    },
    {
      message: 'La fecha y hora de la liquidación no puede ser futura.',
      path: ['settlementDate'],
    },
  );

export type CreateSettlementFormValues = z.infer<
  typeof createSettlementFormSchema
>;
