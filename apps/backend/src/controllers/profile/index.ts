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
import {UsersRepository} from '~/repositories';
import {UsersService} from '~/services';
import {ProfileService} from '~/services/profile';
import {db} from '~/db';
import {
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

const usersRepository = new UsersRepository(db);
const usersService = new UsersService(usersRepository);

@Route('profile')
@Middlewares(requireAuthMiddleware)
@Tags('Profile')
export class ProfileController {
  private service = new ProfileService(usersService);

  @Put('/')
  @ValidateBody(UpdateProfileRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  public async updateProfile(
    @Body() body: UpdateProfileRouteBody,
    @Request() request: express.Request,
  ): Promise<UpdateProfileResponse> {
    return this.service.updateProfile(request.user.clerkId, body);
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
