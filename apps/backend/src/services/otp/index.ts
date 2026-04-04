import crypto from 'node:crypto';
import {OtpVerificationsRepository} from '~/repositories';
import {UsersService} from '~/services/users';
import {getWhatsAppProvider} from '~/services/notifications/providers/WhatsAppProviderFactory';
import {ValidationError, TooManyRequestsError} from '~/errors';
import {OTP_ERROR_MESSAGES} from '~/constants/error-messages';
import {logger} from '~/utils';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RATE_LIMIT = 3; // max requests per window
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const OTP_MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export class OtpService {
  constructor(
    private readonly otpRepository: OtpVerificationsRepository,
    private readonly usersService: UsersService,
  ) {}

  async sendOtp(userId: string, phoneNumber: string) {
    // Rate limit check
    const since = new Date(Date.now() - OTP_RATE_WINDOW_MS);
    const recentCount = await this.otpRepository.countRecentByUser(
      userId,
      since,
    );
    if (recentCount >= OTP_RATE_LIMIT) {
      throw new TooManyRequestsError(OTP_ERROR_MESSAGES.RATE_LIMITED);
    }

    // Generate 6-digit code
    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Store in DB
    await this.otpRepository.create({
      userId,
      phoneNumber,
      codeHash,
      expiresAt,
    });

    // Send via WhatsApp (directly, not through notification system)
    const provider = getWhatsAppProvider();
    try {
      await provider.sendMessage({
        to: phoneNumber,
        templateName: 'revendiste_otp_verification',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [{type: 'text', text: code}],
          },
        ],
      });
    } catch (error) {
      logger.error('Failed to send OTP via WhatsApp', {
        userId,
        phoneNumber,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ValidationError(
        OTP_ERROR_MESSAGES.SEND_FAILED(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }

    return {expiresAt: expiresAt.toISOString()};
  }

  async verifyOtp(userId: string, clerkId: string, code: string) {
    const otp = await this.otpRepository.findLatestActive(userId);

    if (!otp) {
      throw new ValidationError(OTP_ERROR_MESSAGES.EXPIRED);
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new ValidationError(OTP_ERROR_MESSAGES.TOO_MANY_ATTEMPTS);
    }

    // Increment attempts before checking (prevents timing attacks)
    await this.otpRepository.incrementAttempts(otp.id);

    const providedHash = hashCode(code);
    if (providedHash !== otp.codeHash) {
      throw new ValidationError(OTP_ERROR_MESSAGES.INVALID);
    }

    // Mark verified
    await this.otpRepository.markVerified(otp.id);

    // Save phone + opt-in
    await this.usersService.updatePhoneSettings(clerkId, {
      phoneNumber: otp.phoneNumber,
      whatsappOptedIn: true,
    });

    return {success: true as const};
  }
}
