import {
  Body,
  Delete,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Queries,
  Response,
  Route,
  Tags,
} from '@mathfalcon/tsoa-runtime';
import {requireAdminMiddleware, requireAuthMiddleware} from '~/middleware';
import {ValidateBody, ValidateQuery} from '~/decorators';
import {db} from '~/db';
import {
  EventProducerMembersRepository,
  EventProducersRepository,
  UsersRepository,
} from '~/repositories';
import {EventProducersService} from '~/services/event-producers';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {
  AddEventProducerMemberRouteBody,
  AddEventProducerMemberRouteSchema,
  AdminEventProducersListQuery,
  AdminEventProducersListRouteSchema,
  CreateEventProducerRouteBody,
  CreateEventProducerRouteSchema,
  UpdateEventProducerMemberRoleRouteBody,
  UpdateEventProducerMemberRoleRouteSchema,
  UpdateEventProducerRouteBody,
  UpdateEventProducerRouteSchema,
} from './validation';

type ListEventProducersResponse = ReturnType<
  EventProducersService['listEventProducers']
>;
type GetEventProducerResponse = ReturnType<EventProducersService['getEventProducer']>;
type CreateEventProducerResponse = ReturnType<
  EventProducersService['createEventProducer']
>;
type UpdateEventProducerResponse = ReturnType<
  EventProducersService['updateEventProducer']
>;
type DeleteEventProducerResponse = ReturnType<
  EventProducersService['deleteEventProducer']
>;
type ListEventProducerMembersResponse = ReturnType<
  EventProducersService['listMembers']
>;
type AddEventProducerMemberResponse = ReturnType<
  EventProducersService['addMember']
>;
type UpdateEventProducerMemberRoleResponse = ReturnType<
  EventProducersService['updateMemberRole']
>;
type RemoveEventProducerMemberResponse = ReturnType<
  EventProducersService['removeMember']
>;

@Route('admin/event-producers')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Event Producers')
export class AdminEventProducersController {
  private service = new EventProducersService(
    new EventProducersRepository(db),
    new EventProducerMembersRepository(db),
    new UsersRepository(db),
  );

  @Get('/')
  @ValidateQuery(AdminEventProducersListRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async listEventProducers(
    @Queries() query: AdminEventProducersListQuery,
  ): Promise<ListEventProducersResponse> {
    return this.service.listEventProducers(query.search);
  }

  @Get('/{eventProducerId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer not found')
  public async getEventProducer(
    @Path() eventProducerId: string,
  ): Promise<GetEventProducerResponse> {
    return this.service.getEventProducer(eventProducerId);
  }

  @Post('/')
  @ValidateBody(CreateEventProducerRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<ValidationError>(422, 'Validation failed')
  public async createEventProducer(
    @Body() body: CreateEventProducerRouteBody,
  ): Promise<CreateEventProducerResponse> {
    return this.service.createEventProducer(body);
  }

  @Put('/{eventProducerId}')
  @ValidateBody(UpdateEventProducerRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer not found')
  @Response<ValidationError>(422, 'Validation failed')
  public async updateEventProducer(
    @Path() eventProducerId: string,
    @Body() body: UpdateEventProducerRouteBody,
  ): Promise<UpdateEventProducerResponse> {
    return this.service.updateEventProducer(eventProducerId, body);
  }

  @Delete('/{eventProducerId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer not found')
  public async deleteEventProducer(
    @Path() eventProducerId: string,
  ): Promise<DeleteEventProducerResponse> {
    return this.service.deleteEventProducer(eventProducerId);
  }

  @Get('/{eventProducerId}/members')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer not found')
  public async listMembers(
    @Path() eventProducerId: string,
  ): Promise<ListEventProducerMembersResponse> {
    return this.service.listMembers(eventProducerId);
  }

  @Post('/{eventProducerId}/members')
  @ValidateBody(AddEventProducerMemberRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer or user not found')
  @Response<ValidationError>(422, 'Validation failed')
  public async addMember(
    @Path() eventProducerId: string,
    @Body() body: AddEventProducerMemberRouteBody,
  ): Promise<AddEventProducerMemberResponse> {
    return this.service.addMember(eventProducerId, body);
  }

  @Put('/{eventProducerId}/members/{userId}')
  @ValidateBody(UpdateEventProducerMemberRoleRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer or member not found')
  @Response<ValidationError>(422, 'Validation failed')
  public async updateMemberRole(
    @Path() eventProducerId: string,
    @Path() userId: string,
    @Body() body: UpdateEventProducerMemberRoleRouteBody,
  ): Promise<UpdateEventProducerMemberRoleResponse> {
    return this.service.updateMemberRole(eventProducerId, userId, body.role);
  }

  @Delete('/{eventProducerId}/members/{userId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event producer or member not found')
  public async removeMember(
    @Path() eventProducerId: string,
    @Path() userId: string,
  ): Promise<RemoveEventProducerMemberResponse> {
    return this.service.removeMember(eventProducerId, userId);
  }
}
