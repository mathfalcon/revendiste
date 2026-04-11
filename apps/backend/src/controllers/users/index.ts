import express from 'express';
import {
  Route,
  Get,
  Tags,
  Middlewares,
  Request,
  Response,
} from '@mathfalcon/tsoa-runtime';
import {requireAuthMiddleware} from '~/middleware';
import {UnauthorizedError} from '~/errors';
import {UsersService} from '~/services';
import type {CurrentUserMeResponse} from '~/services/users';
import {UsersRepository} from '~/repositories';
import {db} from '~/db';

type GetCurrentUserResponse = CurrentUserMeResponse;

const usersService = new UsersService(new UsersRepository(db));

@Route('users')
@Tags('Users')
export class UsersController {
  @Get('/me')
  @Middlewares(requireAuthMiddleware)
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getCurrentUser(
    @Request() request: express.Request,
  ): Promise<GetCurrentUserResponse> {
    return usersService.buildCurrentUserMeResponse(request.user);
  }
}
