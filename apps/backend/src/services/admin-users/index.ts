import {UsersRepository} from '~/repositories';
import {createPaginatedResponse} from '~/middleware/pagination';
import type {PaginationOptions} from '~/types/pagination';

export class AdminUsersService {
  constructor(private usersRepository: UsersRepository) {}

  async listUsers(
    pagination: PaginationOptions,
    filters: {search?: string},
  ) {
    const [rows, total] = await Promise.all([
      this.usersRepository.listUsersForAdmin({
        search: filters.search,
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      }),
      this.usersRepository.countUsersForAdmin({search: filters.search}),
    ]);

    return createPaginatedResponse(
      rows.map(row => ({
        user: {
          id: row.id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          imageUrl: row.imageUrl,
          role: row.role,
          lastActiveAt: row.lastActiveAt,
        },
      })),
      total,
      pagination,
    );
  }
}
