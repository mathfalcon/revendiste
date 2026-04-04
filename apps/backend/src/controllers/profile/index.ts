import express from 'express';
import {
  Route,
  Get,
  Put,
  Post,
  Delete,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  UploadedFile,
} from '@mathfalcon/tsoa-runtime';
import {requireAuthMiddleware} from '~/middleware';
import {ApiErrorResponse} from '~/errors';
import {Body, ValidateBody} from '~/decorators';
import {UsersRepository, OtpVerificationsRepository} from '~/repositories';
import {UsersService} from '~/services';
import {ProfileService} from '~/services/profile';
import {OtpService} from '~/services/otp';
import {db} from '~/db';
import {
  SendOtpRouteBody,
  SendOtpRouteSchema,
  VerifyOtpRouteBody,
  VerifyOtpRouteSchema,
  UpdatePhoneSettingsRouteBody,
  UpdatePhoneSettingsRouteSchema,
  UpdateProfileRouteBody,
  UpdateProfileRouteSchema,
  AddEmailRouteBody,
  AddEmailRouteSchema,
  VerifyEmailRouteBody,
  VerifyEmailRouteSchema,
  SetPrimaryEmailRouteBody,
  SetPrimaryEmailRouteSchema,
  SetPasswordRouteBody,
  SetPasswordRouteSchema,
  ChangePasswordRouteBody,
  ChangePasswordRouteSchema,
  DeleteAccountRouteBody,
  DeleteAccountRouteSchema,
} from './validation';

type UpdateProfileResponse = ReturnType<ProfileService['updateProfile']>;
type UpdatePhoneSettingsResponse = ReturnType<
  ProfileService['updatePhoneSettings']
>;
type UploadProfileImageResponse = ReturnType<
  ProfileService['uploadProfileImage']
>;
type DeleteProfileImageResponse = ReturnType<
  ProfileService['deleteProfileImage']
>;
type GetEmailsResponse = ReturnType<ProfileService['getEmails']>;
type AddEmailResponse = ReturnType<ProfileService['addEmail']>;
type VerifyEmailResponse = ReturnType<ProfileService['verifyEmail']>;
type SetPrimaryEmailResponse = ReturnType<ProfileService['setPrimaryEmail']>;
type DeleteEmailResponse = ReturnType<ProfileService['deleteEmail']>;
type GetExternalAccountsResponse = ReturnType<
  ProfileService['getExternalAccounts']
>;
type GetPasswordStatusResponse = ReturnType<
  ProfileService['getPasswordStatus']
>;
type SetPasswordResponse = ReturnType<ProfileService['setPassword']>;
type ChangePasswordResponse = ReturnType<ProfileService['changePassword']>;
type GetSessionsResponse = ReturnType<ProfileService['getSessions']>;
type RevokeSessionResponse = ReturnType<ProfileService['revokeSession']>;
type DeleteAccountResponse = ReturnType<ProfileService['deleteAccount']>;
type SendOtpResponse = ReturnType<OtpService['sendOtp']>;
type VerifyOtpResponse = ReturnType<OtpService['verifyOtp']>;

const usersRepository = new UsersRepository(db);
const usersService = new UsersService(usersRepository);
const otpRepository = new OtpVerificationsRepository(db);

@Route('profile')
@Middlewares(requireAuthMiddleware)
@Tags('Profile')
export class ProfileController {
  private service = new ProfileService(usersService);
  private otpService = new OtpService(otpRepository, usersService);

  @Put('/')
  @ValidateBody(UpdateProfileRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async updateProfile(
    @Body() body: UpdateProfileRouteBody,
    @Request() request: express.Request,
  ): Promise<UpdateProfileResponse> {
    return this.service.updateProfile(request.user.clerkId, body);
  }

  @Put('/phone')
  @ValidateBody(UpdatePhoneSettingsRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async updatePhoneSettings(
    @Body() body: UpdatePhoneSettingsRouteBody,
    @Request() request: express.Request,
  ): Promise<UpdatePhoneSettingsResponse> {
    return this.service.updatePhoneSettings(request.user.clerkId, body);
  }

  @Post('/phone/send-otp')
  @ValidateBody(SendOtpRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(429, 'Too many OTP requests')
  public async sendOtp(
    @Body() body: SendOtpRouteBody,
    @Request() request: express.Request,
  ): Promise<SendOtpResponse> {
    return this.otpService.sendOtp(request.user.id, body.phoneNumber);
  }

  @Post('/phone/verify-otp')
  @ValidateBody(VerifyOtpRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Invalid or expired OTP')
  public async verifyOtp(
    @Body() body: VerifyOtpRouteBody,
    @Request() request: express.Request,
  ): Promise<VerifyOtpResponse> {
    return this.otpService.verifyOtp(
      request.user.id,
      request.user.clerkId,
      body.code,
    );
  }

  @Put('/image')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Image upload failed')
  public async uploadProfileImage(
    @UploadedFile('file') file: Express.Multer.File,
    @Request() request: express.Request,
  ): Promise<UploadProfileImageResponse> {
    return this.service.uploadProfileImage(request.user.clerkId, file);
  }

  @Delete('/image')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async deleteProfileImage(
    @Request() request: express.Request,
  ): Promise<DeleteProfileImageResponse> {
    return this.service.deleteProfileImage(request.user.clerkId);
  }

  @Get('/emails')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async getEmails(
    @Request() request: express.Request,
  ): Promise<GetEmailsResponse> {
    return this.service.getEmails(request.user.clerkId);
  }

  @Post('/emails')
  @ValidateBody(AddEmailRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Failed to add email')
  public async addEmail(
    @Body() body: AddEmailRouteBody,
    @Request() request: express.Request,
  ): Promise<AddEmailResponse> {
    return this.service.addEmail(request.user.clerkId, body.emailAddress);
  }

  @Post('/emails/verify')
  @ValidateBody(VerifyEmailRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Verification failed')
  @Response<ApiErrorResponse>(403, 'Email does not belong to user')
  public async verifyEmail(
    @Body() body: VerifyEmailRouteBody,
    @Request() request: express.Request,
  ): Promise<VerifyEmailResponse> {
    return this.service.verifyEmail(
      request.user.clerkId,
      body.emailAddressId,
      body.code,
    );
  }

  @Put('/emails/primary')
  @ValidateBody(SetPrimaryEmailRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(403, 'Email does not belong to user')
  public async setPrimaryEmail(
    @Body() body: SetPrimaryEmailRouteBody,
    @Request() request: express.Request,
  ): Promise<SetPrimaryEmailResponse> {
    return this.service.setPrimaryEmail(
      request.user.clerkId,
      body.emailAddressId,
    );
  }

  @Delete('/emails/{emailAddressId}')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(403, 'Email does not belong to user')
  @Response<ApiErrorResponse>(400, 'Cannot delete primary email')
  public async deleteEmail(
    @Path() emailAddressId: string,
    @Request() request: express.Request,
  ): Promise<DeleteEmailResponse> {
    return this.service.deleteEmail(request.user.clerkId, emailAddressId);
  }

  @Get('/external-accounts')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async getExternalAccounts(
    @Request() request: express.Request,
  ): Promise<GetExternalAccountsResponse> {
    return this.service.getExternalAccounts(request.user.clerkId);
  }

  @Get('/password-status')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async getPasswordStatus(
    @Request() request: express.Request,
  ): Promise<GetPasswordStatusResponse> {
    return this.service.getPasswordStatus(request.user.clerkId);
  }

  @Post('/password')
  @ValidateBody(SetPasswordRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Already has password')
  public async setPassword(
    @Body() body: SetPasswordRouteBody,
    @Request() request: express.Request,
  ): Promise<SetPasswordResponse> {
    return this.service.setPassword(request.user.clerkId, body.newPassword);
  }

  @Put('/password')
  @ValidateBody(ChangePasswordRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Current password incorrect')
  public async changePassword(
    @Body() body: ChangePasswordRouteBody,
    @Request() request: express.Request,
  ): Promise<ChangePasswordResponse> {
    return this.service.changePassword(
      request.user.clerkId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Get('/sessions')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async getSessions(
    @Request() request: express.Request,
  ): Promise<GetSessionsResponse> {
    return this.service.getSessions(request.user.clerkId);
  }

  @Delete('/sessions/{sessionId}')
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(403, 'Session does not belong to user')
  public async revokeSession(
    @Path() sessionId: string,
    @Request() request: express.Request,
  ): Promise<RevokeSessionResponse> {
    return this.service.revokeSession(request.user.clerkId, sessionId);
  }

  @Delete('/account')
  @ValidateBody(DeleteAccountRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(422, 'Invalid confirmation')
  public async deleteAccount(
    @Body() body: DeleteAccountRouteBody,
    @Request() request: express.Request,
  ): Promise<DeleteAccountResponse> {
    return this.service.deleteAccount(request.user.clerkId);
  }
}
