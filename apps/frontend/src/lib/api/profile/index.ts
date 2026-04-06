import {queryOptions, mutationOptions} from '@tanstack/react-query';
import {api} from '..';
import {toast} from 'sonner';

export const getEmailsQuery = () =>
  queryOptions({
    queryKey: ['profile', 'emails'],
    queryFn: () => api.profile.getEmails().then(res => res.data),
  });

export const getExternalAccountsQuery = () =>
  queryOptions({
    queryKey: ['profile', 'external-accounts'],
    queryFn: () => api.profile.getExternalAccounts().then(res => res.data),
  });

export const getPasswordStatusQuery = () =>
  queryOptions({
    queryKey: ['profile', 'password-status'],
    queryFn: () => api.profile.getPasswordStatus().then(res => res.data),
  });

export const getSessionsQuery = () =>
  queryOptions({
    queryKey: ['profile', 'sessions'],
    queryFn: () => api.profile.getSessions().then(res => res.data),
  });

export const updateProfileMutation = () =>
  mutationOptions({
    mutationKey: ['update-profile'],
    mutationFn: (data: {firstName: string; lastName: string}) =>
      api.profile.updateProfile(data).then(res => res.data),
    onSuccess: () => {
      toast.success('Perfil actualizado');
    },
  });

export const uploadProfileImageMutation = () =>
  mutationOptions({
    mutationKey: ['upload-profile-image'],
    mutationFn: (file: File) =>
      api.profile.uploadProfileImage({file}).then(res => res.data),
    onSuccess: () => {
      toast.success('Imagen de perfil actualizada');
    },
  });

export const deleteProfileImageMutation = () =>
  mutationOptions({
    mutationKey: ['delete-profile-image'],
    mutationFn: () => api.profile.deleteProfileImage().then(res => res.data),
    onSuccess: () => {
      toast.success('Imagen de perfil eliminada');
    },
  });

export const addEmailMutation = () =>
  mutationOptions({
    mutationKey: ['add-email'],
    mutationFn: (emailAddress: string) =>
      api.profile.addEmail({emailAddress}).then(res => res.data),
  });

export const verifyEmailMutation = () =>
  mutationOptions({
    mutationKey: ['verify-email'],
    mutationFn: (data: {emailAddressId: string; code: string}) =>
      api.profile.verifyEmail(data).then(res => res.data),
  });

export const setPrimaryEmailMutation = () =>
  mutationOptions({
    mutationKey: ['set-primary-email'],
    mutationFn: (emailAddressId: string) =>
      api.profile.setPrimaryEmail({emailAddressId}).then(res => res.data),
    onSuccess: () => {
      toast.success('Email principal actualizado');
    },
  });

export const deleteEmailMutation = () =>
  mutationOptions({
    mutationKey: ['delete-email'],
    mutationFn: (emailAddressId: string) =>
      api.profile.deleteEmail(emailAddressId).then(res => res.data),
    onSuccess: () => {
      toast.success('Email eliminado');
    },
  });

export const setPasswordMutation = () =>
  mutationOptions({
    mutationKey: ['set-password'],
    mutationFn: (newPassword: string) =>
      api.profile.setPassword({newPassword}).then(res => res.data),
    onSuccess: () => {
      toast.success('Contraseña creada');
    },
  });

export const changePasswordMutation = () =>
  mutationOptions({
    mutationKey: ['change-password'],
    mutationFn: (data: {currentPassword: string; newPassword: string}) =>
      api.profile.changePassword(data).then(res => res.data),
    onSuccess: () => {
      toast.success('Contraseña actualizada');
    },
  });

export const revokeSessionMutation = () =>
  mutationOptions({
    mutationKey: ['revoke-session'],
    mutationFn: (sessionId: string) =>
      api.profile.revokeSession(sessionId).then(res => res.data),
    onSuccess: () => {
      toast.success('Sesión cerrada');
    },
  });

export const updatePhoneSettingsMutation = () =>
  mutationOptions({
    mutationKey: ['update-phone-settings'],
    mutationFn: (data: {
      phoneNumber: string | null;
      whatsappOptedIn: boolean;
    }) => api.profile.updatePhoneSettings(data).then(res => res.data),
    onSuccess: () => {
      toast.success('Teléfono actualizado');
    },
  });

export const dismissWhatsappPromptMutation = () =>
  mutationOptions({
    mutationKey: ['dismiss-whatsapp-prompt'],
    mutationFn: () => api.profile.dismissWhatsappPrompt().then(res => res.data),
  });

export const sendWhatsappOtpMutation = () =>
  mutationOptions({
    mutationKey: ['send-whatsapp-otp'],
    mutationFn: (data: {phoneNumber: string}) =>
      api.profile.sendOtp(data).then(res => res.data),
  });

export const verifyWhatsappOtpMutation = () =>
  mutationOptions({
    mutationKey: ['verify-whatsapp-otp'],
    mutationFn: (data: {code: string}) =>
      api.profile.verifyOtp(data).then(res => res.data),
  });

export const deleteAccountMutation = () =>
  mutationOptions({
    mutationKey: ['delete-account'],
    mutationFn: () =>
      api.profile
        .deleteAccount({confirmation: 'ELIMINAR'})
        .then(res => res.data),
    onSuccess: () => {
      toast.success('Cuenta eliminada');
    },
  });
