import type {Insertable} from 'kysely';
import type {Users} from '@revendiste/shared';

type UserFactoryOverrides = Partial<Insertable<Users>>;

let counter = 1;

export function createUser(
  overrides: UserFactoryOverrides = {},
): Insertable<Users> {
  const id = (overrides.id as string | undefined) ?? `user-${counter++}`;
  return {
    id,
    email: overrides.email ?? `${id}@test.com`,
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    clerkId: overrides.clerkId ?? `clerk_${id}`,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    deletedAt: overrides.deletedAt ?? null,
    documentCountry: overrides.documentCountry ?? null,
    documentImagePath: overrides.documentImagePath ?? null,
    documentNumber: overrides.documentNumber ?? null,
    documentType: overrides.documentType ?? null,
    documentVerified: overrides.documentVerified ?? null,
    documentVerifiedAt: overrides.documentVerifiedAt ?? null,
    imageUrl: overrides.imageUrl ?? null,
    lastActiveAt: overrides.lastActiveAt ?? null,
    manualReviewReason: overrides.manualReviewReason ?? null,
    metadata: overrides.metadata ?? null,
    role: overrides.role ?? 'user',
    selfieImagePath: overrides.selfieImagePath ?? null,
    verificationAttempts: overrides.verificationAttempts ?? null,
    verificationConfidenceScores: overrides.verificationConfidenceScores ?? null,
    verificationMetadata: overrides.verificationMetadata ?? null,
    verificationSessionCreatedAt:
      overrides.verificationSessionCreatedAt ?? null,
    verificationSessionId: overrides.verificationSessionId ?? null,
    verificationStatus: overrides.verificationStatus ?? null,
    ...overrides,
  };
}

export function resetUserFactory(): void {
  counter = 1;
}
