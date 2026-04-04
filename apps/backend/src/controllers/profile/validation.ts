import {z} from 'zod';
import {PROFILE_ERROR_MESSAGES} from '~/constants/error-messages';

export const UpdateProfileRouteSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, PROFILE_ERROR_MESSAGES.FIRST_NAME_REQUIRED),
    lastName: z.string().min(1, PROFILE_ERROR_MESSAGES.LAST_NAME_REQUIRED),
  }),
});

export type UpdateProfileRouteBody = z.infer<
  typeof UpdateProfileRouteSchema
>['body'];

export const SetPrimaryEmailRouteSchema = z.object({
  body: z.object({
    emailAddressId: z
      .string()
      .min(1, PROFILE_ERROR_MESSAGES.EMAIL_ADDRESS_ID_REQUIRED),
  }),
});

export type SetPrimaryEmailRouteBody = z.infer<
  typeof SetPrimaryEmailRouteSchema
>['body'];

export const AddEmailRouteSchema = z.object({
  body: z.object({
    emailAddress: z
      .string()
      .email(PROFILE_ERROR_MESSAGES.EMAIL_ADDRESS_REQUIRED)
      .min(1, PROFILE_ERROR_MESSAGES.EMAIL_ADDRESS_REQUIRED),
  }),
});

export type AddEmailRouteBody = z.infer<typeof AddEmailRouteSchema>['body'];

export const VerifyEmailRouteSchema = z.object({
  body: z.object({
    emailAddressId: z
      .string()
      .min(1, PROFILE_ERROR_MESSAGES.EMAIL_ADDRESS_ID_REQUIRED),
    code: z
      .string()
      .min(1, PROFILE_ERROR_MESSAGES.EMAIL_VERIFICATION_CODE_REQUIRED),
  }),
});

export type VerifyEmailRouteBody = z.infer<
  typeof VerifyEmailRouteSchema
>['body'];

export const SetPasswordRouteSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(8, PROFILE_ERROR_MESSAGES.PASSWORD_TOO_SHORT),
  }),
});

export type SetPasswordRouteBody = z.infer<
  typeof SetPasswordRouteSchema
>['body'];

export const ChangePasswordRouteSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, PROFILE_ERROR_MESSAGES.CURRENT_PASSWORD_REQUIRED),
    newPassword: z
      .string()
      .min(8, PROFILE_ERROR_MESSAGES.PASSWORD_TOO_SHORT),
  }),
});

export type ChangePasswordRouteBody = z.infer<
  typeof ChangePasswordRouteSchema
>['body'];

export const UpdatePhoneSettingsRouteSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{6,14}$/,
        'Número de teléfono inválido (formato E.164, ej: +59899123456)',
      )
      .nullable(),
    whatsappOptedIn: z.boolean(),
  }),
});

export type UpdatePhoneSettingsRouteBody = z.infer<
  typeof UpdatePhoneSettingsRouteSchema
>['body'];

export const SendOtpRouteSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{6,14}$/,
        'Número de teléfono inválido (formato E.164, ej: +59899123456)',
      ),
  }),
});

export type SendOtpRouteBody = z.infer<typeof SendOtpRouteSchema>['body'];

export const VerifyOtpRouteSchema = z.object({
  body: z.object({
    code: z
      .string()
      .length(6, 'El código debe tener 6 dígitos')
      .regex(/^\d{6}$/, 'El código debe contener solo números'),
  }),
});

export type VerifyOtpRouteBody = z.infer<
  typeof VerifyOtpRouteSchema
>['body'];

export const DeleteAccountRouteSchema = z.object({
  body: z.object({
    confirmation: z
      .string()
      .refine(val => val === 'ELIMINAR', {
        message: PROFILE_ERROR_MESSAGES.DELETE_CONFIRMATION_INVALID,
      }),
  }),
});

export type DeleteAccountRouteBody = z.infer<
  typeof DeleteAccountRouteSchema
>['body'];
