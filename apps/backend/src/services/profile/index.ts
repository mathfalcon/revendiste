import {clerkClient} from '@clerk/express';
import {BadRequestError, NotFoundError, ForbiddenError} from '~/errors';
import {PROFILE_ERROR_MESSAGES} from '~/constants/error-messages';
import {UsersService} from '~/services/users';
import {getStorageProvider} from '~/services/storage/StorageFactory';
import {logger} from '~/utils';

export class ProfileService {
  constructor(private usersService: UsersService) {}

  async updateProfile(
    clerkId: string,
    data: {firstName: string; lastName: string},
  ) {
    const updatedUser = await clerkClient.users.updateUser(clerkId, {
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    };
  }

  async uploadProfileImage(clerkId: string, file: Express.Multer.File) {
    try {
      // Upload to our CDN (R2 public bucket) for fast delivery
      const storage = getStorageProvider();
      const result = await storage.upload(file.buffer, {
        directory: 'public/avatars',
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });

      // Update imageUrl in our DB to the CDN URL
      await this.usersService.updateImageUrl(clerkId, result.url);

      // Also upload to Clerk (fire-and-forget) to keep Clerk dashboard in sync
      const blob = new Blob([file.buffer as BlobPart], {type: file.mimetype});
      const imageFile = new File([blob], file.originalname, {
        type: file.mimetype,
      });
      clerkClient.users
        .updateUserProfileImage(clerkId, {file: imageFile})
        .catch(err =>
          logger.warn('Failed to sync profile image to Clerk:', err),
        );

      return {imageUrl: result.url};
    } catch (error: any) {
      logger.error('Failed to upload profile image:', error);
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.IMAGE_UPLOAD_FAILED(
          error.message || 'Unknown error',
        ),
      );
    }
  }

  async deleteProfileImage(clerkId: string) {
    try {
      // Get user to find current avatar path for R2 cleanup
      const user = await this.usersService.findByClerkId(clerkId);
      if (user?.imageUrl) {
        // Try to delete from R2 if it's a CDN URL
        try {
          const storage = getStorageProvider();
          // Extract the R2 key from the CDN URL (path after domain)
          const url = new URL(user.imageUrl);
          const key = url.pathname.replace(/^\//, '');
          if (key.startsWith('public/avatars/')) {
            await storage.delete(key);
          }
        } catch (err) {
          logger.warn('Failed to delete avatar from storage:', err);
        }
      }

      // Clear imageUrl in our DB
      await this.usersService.updateImageUrl(clerkId, null);

      // Also delete from Clerk (fire-and-forget)
      clerkClient.users
        .deleteUserProfileImage(clerkId)
        .catch(err =>
          logger.warn('Failed to delete profile image from Clerk:', err),
        );

      return {success: true};
    } catch (error: any) {
      logger.error('Failed to delete profile image:', error);
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.IMAGE_DELETE_FAILED(
          error.message || 'Unknown error',
        ),
      );
    }
  }

  async getEmails(clerkId: string): Promise<
    {
      id: string;
      emailAddress: string;
      isPrimary: boolean;
      verification: {status: string} | null;
    }[]
  > {
    const user = await clerkClient.users.getUser(clerkId);

    return user.emailAddresses.map(email => ({
      id: email.id,
      emailAddress: email.emailAddress,
      isPrimary: user.primaryEmailAddressId === email.id,
      verification: email.verification
        ? {status: email.verification.status}
        : null,
    }));
  }

  async addEmail(clerkId: string, emailAddress: string) {
    try {
      const emailResource =
        await clerkClient.emailAddresses.createEmailAddress({
          userId: clerkId,
          emailAddress,
        });

      return {
        emailAddressId: emailResource.id,
        emailAddress: emailResource.emailAddress,
      };
    } catch (error: any) {
      logger.error('Failed to add email:', error);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        error.message ||
        'Unknown error';
      throw new BadRequestError(PROFILE_ERROR_MESSAGES.EMAIL_ADD_FAILED(message));
    }
  }

  async verifyEmail(
    clerkId: string,
    emailAddressId: string,
    code: string,
  ) {
    const user = await clerkClient.users.getUser(clerkId);
    const emailBelongsToUser = user.emailAddresses.some(
      e => e.id === emailAddressId,
    );

    if (!emailBelongsToUser) {
      throw new ForbiddenError(PROFILE_ERROR_MESSAGES.EMAIL_NOT_OWNED);
    }

    try {
      await clerkClient.emailAddresses.updateEmailAddress(emailAddressId, {
        verified: true,
      });

      return {success: true};
    } catch (error: any) {
      logger.error('Failed to verify email:', error);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        error.message ||
        'Unknown error';
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.EMAIL_VERIFICATION_FAILED(message),
      );
    }
  }

  async setPrimaryEmail(clerkId: string, emailAddressId: string) {
    const user = await clerkClient.users.getUser(clerkId);
    const emailBelongsToUser = user.emailAddresses.some(
      e => e.id === emailAddressId,
    );

    if (!emailBelongsToUser) {
      throw new ForbiddenError(PROFILE_ERROR_MESSAGES.EMAIL_NOT_OWNED);
    }

    await clerkClient.users.updateUser(clerkId, {
      primaryEmailAddressID: emailAddressId,
    });

    return {success: true};
  }

  async deleteEmail(clerkId: string, emailAddressId: string) {
    const user = await clerkClient.users.getUser(clerkId);
    const email = user.emailAddresses.find(e => e.id === emailAddressId);

    if (!email) {
      throw new NotFoundError(PROFILE_ERROR_MESSAGES.EMAIL_NOT_FOUND);
    }

    if (user.primaryEmailAddressId === emailAddressId) {
      throw new BadRequestError(PROFILE_ERROR_MESSAGES.EMAIL_IS_PRIMARY);
    }

    await clerkClient.emailAddresses.deleteEmailAddress(emailAddressId);

    return {success: true};
  }

  async getExternalAccounts(clerkId: string) {
    const user = await clerkClient.users.getUser(clerkId);

    return user.externalAccounts.map(account => ({
      id: account.id,
      provider: account.provider,
      emailAddress: account.emailAddress,
      firstName: account.firstName,
      lastName: account.lastName,
      imageUrl: account.imageUrl,
    }));
  }

  async getPasswordStatus(clerkId: string) {
    const user = await clerkClient.users.getUser(clerkId);
    return {hasPassword: user.passwordEnabled};
  }

  async setPassword(clerkId: string, newPassword: string) {
    const user = await clerkClient.users.getUser(clerkId);

    if (user.passwordEnabled) {
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.ALREADY_HAS_PASSWORD,
      );
    }

    try {
      await clerkClient.users.updateUser(clerkId, {password: newPassword});
      return {success: true};
    } catch (error: any) {
      logger.error('Failed to set password:', error);
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.PASSWORD_SET_FAILED(
          error.message || 'Unknown error',
        ),
      );
    }
  }

  async changePassword(
    clerkId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await clerkClient.users.getUser(clerkId);

    if (!user.passwordEnabled) {
      throw new BadRequestError(PROFILE_ERROR_MESSAGES.NO_PASSWORD_SET);
    }

    try {
      await clerkClient.users.verifyPassword({
        userId: clerkId,
        password: currentPassword,
      });
    } catch {
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT,
      );
    }

    try {
      await clerkClient.users.updateUser(clerkId, {
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      return {success: true};
    } catch (error: any) {
      logger.error('Failed to change password:', error);
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.PASSWORD_SET_FAILED(
          error.message || 'Unknown error',
        ),
      );
    }
  }

  async getSessions(clerkId: string) {
    const sessions = await clerkClient.sessions.getSessionList({
      userId: clerkId,
      status: 'active',
    });

    return sessions.data.map(session => ({
      id: session.id,
      clientId: session.clientId,
      lastActiveAt: session.lastActiveAt,
      expireAt: session.expireAt,
      status: session.status,
      latestActivity: session.latestActivity
        ? {
            browserName: session.latestActivity.browserName,
            browserVersion: session.latestActivity.browserVersion,
            deviceType: session.latestActivity.deviceType,
            ipAddress: session.latestActivity.ipAddress,
            city: session.latestActivity.city,
            country: session.latestActivity.country,
            isMobile: session.latestActivity.isMobile,
          }
        : null,
    }));
  }

  async revokeSession(clerkId: string, sessionId: string) {
    const sessions = await clerkClient.sessions.getSessionList({
      userId: clerkId,
      status: 'active',
    });

    const sessionBelongsToUser = sessions.data.some(s => s.id === sessionId);

    if (!sessionBelongsToUser) {
      throw new ForbiddenError(PROFILE_ERROR_MESSAGES.SESSION_NOT_OWNED);
    }

    try {
      await clerkClient.sessions.revokeSession(sessionId);
      return {success: true};
    } catch (error: any) {
      logger.error('Failed to revoke session:', error);
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.SESSION_REVOKE_FAILED(
          error.message || 'Unknown error',
        ),
      );
    }
  }

  async deleteAccount(clerkId: string) {
    try {
      await clerkClient.users.deleteUser(clerkId);
      await this.usersService.deleteUser(clerkId);
      return {success: true};
    } catch (error: any) {
      logger.error('Failed to delete account:', error);
      throw new BadRequestError(
        PROFILE_ERROR_MESSAGES.ACCOUNT_DELETE_FAILED(
          error.message || 'Unknown error',
        ),
      );
    }
  }
}
