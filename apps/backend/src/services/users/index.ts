import {UsersRepository} from '~/repositories';
import {getStorageProvider} from '~/services/storage/StorageFactory';
import {logger} from '~/utils';
import type {User} from '~/types';

export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  // Create or update user from Clerk data
  async createOrUpdateUser(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    try {
      logger.info(`Creating/updating user with clerk ID: ${userData.clerkId}`);

      const user = await this.usersRepository.upsertByClerkId(userData);

      logger.info(`Successfully created/updated user: ${user.id}`);
      return user;
    } catch (error) {
      logger.error(
        `Failed to create/update user with clerk ID ${userData.clerkId}:`,
        error,
      );
      throw error;
    }
  }

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string) {
    try {
      const user = await this.usersRepository.findByClerkId(clerkId);
      return user;
    } catch (error) {
      logger.error(`Failed to get user by clerk ID ${clerkId}:`, error);
      throw error;
    }
  }

  // Update user's last active timestamp
  async updateUserLastActive(clerkId: string, lastActiveAt?: Date) {
    try {
      const user = await this.usersRepository.updateLastActive(
        clerkId,
        lastActiveAt || new Date(),
      );
      return user;
    } catch (error) {
      logger.error(
        `Failed to update last active for user with clerk ID ${clerkId}:`,
        error,
      );
      throw error;
    }
  }

  // Get or create user (useful for auth middleware)
  // Only requires the fields from Clerk auth - other fields have defaults in DB
  async getOrCreateUser(
    userData: Pick<
      User,
      | 'clerkId'
      | 'email'
      | 'firstName'
      | 'lastName'
      | 'imageUrl'
      | 'lastActiveAt'
      | 'metadata'
      | 'role'
    >,
  ) {
    try {
      // Try to find existing user
      let user = await this.usersRepository.findByClerkId(userData.clerkId);

      if (user) {
        // User exists, update last active and return
        this.usersRepository.updateLastActive(
          userData.clerkId,
          userData.lastActiveAt || new Date(),
        );
        return user;
      } else {
        // User doesn't exist, create new one
        user = await this.usersRepository.upsertByClerkId(userData);

        // If user has a Clerk-hosted image (e.g. Google OAuth photo),
        // sync it to our CDN in the background for faster loading
        if (userData.imageUrl && !userData.imageUrl.includes('/avatars/')) {
          this.syncAvatarToCdn(user.clerkId, userData.imageUrl).catch(err =>
            logger.warn('Failed to sync avatar to CDN:', err),
          );
        }

        return user;
      }
    } catch (error) {
      logger.error(
        `Failed to get or create user with clerk ID ${userData.clerkId}:`,
        error,
      );
      throw error;
    }
  }

  // Download an external avatar and re-upload to our CDN
  private async syncAvatarToCdn(clerkId: string, externalUrl: string) {
    const response = await fetch(externalUrl);
    if (!response.ok) return;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    const storage = getStorageProvider();
    const result = await storage.upload(buffer, {
      directory: 'public/avatars',
      originalName: `${clerkId}-oauth.jpg`,
      mimeType: contentType,
      sizeBytes: buffer.length,
    });

    await this.usersRepository.updateImageUrl(clerkId, result.url);
    logger.info(`Synced OAuth avatar to CDN for user ${clerkId}`);
  }

  // Update user's avatar URL
  async updateImageUrl(clerkId: string, imageUrl: string | null) {
    return this.usersRepository.updateImageUrl(clerkId, imageUrl);
  }

  // Update user's phone number and WhatsApp opt-in
  async updatePhoneSettings(
    clerkId: string,
    data: {phoneNumber: string | null; whatsappOptedIn: boolean},
  ) {
    return this.usersRepository.updatePhoneSettings(clerkId, data);
  }

  // Dismiss WhatsApp opt-in prompt
  async dismissWhatsappPrompt(clerkId: string) {
    return this.usersRepository.dismissWhatsappPrompt(clerkId);
  }

  // Find user by Clerk ID (direct passthrough)
  async findByClerkId(clerkId: string) {
    return this.usersRepository.findByClerkId(clerkId);
  }

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const user = await this.usersRepository.findByEmail(email);
      return user;
    } catch (error) {
      logger.error(`Failed to get user by email ${email}:`, error);
      throw error;
    }
  }

  // Soft delete user
  async deleteUser(clerkId: string) {
    try {
      const user = await this.usersRepository.softDelete(clerkId);
      logger.info(`Successfully soft deleted user with clerk ID: ${clerkId}`);
      return user;
    } catch (error) {
      logger.error(`Failed to delete user with clerk ID ${clerkId}:`, error);
      throw error;
    }
  }
}
