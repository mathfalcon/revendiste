import express from 'express';
import {Route, Get, Tags, Middlewares, Request, Response} from '@mathfalcon/tsoa-runtime';
import {requireAuthMiddleware} from '~/middleware';
import {UnauthorizedError} from '~/errors';

type GetCurrentUserResponse = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: 'user' | 'organizer' | 'admin';
};

@Route('users')
@Tags('Users')
export class UsersController {
  @Get('/me')
  @Middlewares(requireAuthMiddleware)
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getCurrentUser(
    @Request() request: express.Request,
  ): Promise<GetCurrentUserResponse> {
    return {
      id: request.user.id,
      email: request.user.email,
      firstName: request.user.firstName,
      lastName: request.user.lastName,
      imageUrl: request.user.imageUrl,
      role: request.user.role,
    };
  }
}

