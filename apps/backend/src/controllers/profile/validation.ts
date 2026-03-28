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
