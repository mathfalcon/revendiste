import {
  Route,
  Get,
  Tags,
  Middlewares,
  Response,
  Queries,
} from '@mathfalcon/tsoa-runtime';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
} from '~/middleware';
import {UnauthorizedError} from '~/errors';
import {ValidateQuery} from '~/decorators';
import {db} from '~/db';
import {AdminDashboardRepository} from '~/repositories/admin-dashboard';
import {AdminDashboardService} from '~/services/admin/dashboard';
import {
  AdminDashboardQuery,
  AdminDashboardRouteSchema,
  resolveDashboardDateRange,
} from './validation';
import type {
  GetDashboardTicketsResponse,
  GetDashboardRevenueResponse,
  GetDashboardOrdersResponse,
  GetDashboardPayoutsResponse,
  GetDashboardHealthResponse,
  GetDashboardTopEventsResponse,
} from '~/services/admin/dashboard/types';

@Route('admin/dashboard')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Dashboard')
export class AdminDashboardController {
  private service = new AdminDashboardService(
    new AdminDashboardRepository(db),
  );

  @Get('/tickets')
  @ValidateQuery(AdminDashboardRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getDashboardTickets(
    @Queries() query: AdminDashboardQuery,
  ): Promise<GetDashboardTicketsResponse> {
    return this.service.getTicketsStats(resolveDashboardDateRange(query));
  }

  @Get('/revenue')
  @ValidateQuery(AdminDashboardRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getDashboardRevenue(
    @Queries() query: AdminDashboardQuery,
  ): Promise<GetDashboardRevenueResponse> {
    return this.service.getRevenueStats(resolveDashboardDateRange(query));
  }

  @Get('/orders')
  @ValidateQuery(AdminDashboardRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getDashboardOrders(
    @Queries() query: AdminDashboardQuery,
  ): Promise<GetDashboardOrdersResponse> {
    return this.service.getOrdersStats(resolveDashboardDateRange(query));
  }

  @Get('/payouts')
  @ValidateQuery(AdminDashboardRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getDashboardPayouts(
    @Queries() query: AdminDashboardQuery,
  ): Promise<GetDashboardPayoutsResponse> {
    return this.service.getPayoutsStats(resolveDashboardDateRange(query));
  }

  @Get('/health')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getDashboardHealth(): Promise<GetDashboardHealthResponse> {
    return this.service.getHealthStats();
  }

  @Get('/top-events')
  @ValidateQuery(AdminDashboardRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getDashboardTopEvents(
    @Queries() query: AdminDashboardQuery,
  ): Promise<GetDashboardTopEventsResponse> {
    return this.service.getTopEventsStats(resolveDashboardDateRange(query));
  }
}
