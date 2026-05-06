import {clerkClient} from '@clerk/express';
import {ADMIN_ERROR_MESSAGES} from '~/constants/error-messages';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {ImpersonationLogsRepository, UsersRepository} from '~/repositories';
import type {User} from '~/types';

export class AdminImpersonationService {
  constructor(
    private usersRepository: UsersRepository,
    private impersonationLogsRepository: ImpersonationLogsRepository,
  ) {}

  async createActorToken(args: {
    adminUser: User;
    targetUserId: string;
    reason: string | null | undefined;
    ipAddress: string;
  }) {
    if (args.adminUser.role !== 'admin') {
      throw new UnauthorizedError(ADMIN_ERROR_MESSAGES.ADMIN_ONLY);
    }

    if (args.targetUserId === args.adminUser.id) {
      throw new ValidationError(
        ADMIN_ERROR_MESSAGES.IMPERSONATION_SELF_NOT_ALLOWED,
      );
    }

    const target = await this.usersRepository.getById(args.targetUserId);
    if (!target) {
      throw new NotFoundError(
        ADMIN_ERROR_MESSAGES.IMPERSONATION_TARGET_NOT_FOUND,
      );
    }

    if (target.role === 'admin') {
      throw new ValidationError(
        ADMIN_ERROR_MESSAGES.IMPERSONATION_TARGET_ADMIN_NOT_ALLOWED,
      );
    }

    await this.impersonationLogsRepository.insertLog({
      adminUserId: args.adminUser.id,
      targetUserId: target.id,
      reason: args.reason?.trim() || null,
      ipAddress: args.ipAddress,
    });

    const actorToken = await clerkClient.actorTokens.create({
      userId: target.clerkId,
      actor: {sub: args.adminUser.clerkId},
      expiresInSeconds: 600,
      sessionMaxDurationInSeconds: 1800,
    });

    // Clerk Frontend API URL: signs out existing session, then redirects to
    // CLERK_SIGN_IN_URL (/ingresar) with __clerk_ticket to complete impersonation.
    return {impersonationUrl: actorToken.url!};
  }
}
