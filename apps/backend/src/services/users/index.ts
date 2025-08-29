import {UsersRepository} from '~/repositories';
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
  async getOrCreateUser(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
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
