import {db} from '~/db';
import {PaginationOptions} from '~/types/pagination';
import {createPaginatedResponse} from '~/middleware/pagination';
import {NotFoundError} from '~/errors';

export class ExampleRepository {
  async findAll() {
    const rows = await db.selectFrom('examples').selectAll().execute();

    return rows;
  }

  async findAllPaginated(options: PaginationOptions) {
    // Get total count
    const totalResult = await db
      .selectFrom('examples')
      .select(db.fn.count('id').as('total'))
      .executeTakeFirst();

    const total = Number(totalResult?.total || 0);

    // Get paginated data
    let query = db.selectFrom('examples').selectAll();

    // Apply sorting based on field
    if (options.sortBy === 'name') {
      query = query.orderBy('name', options.sortOrder);
    } else if (options.sortBy === 'createdAt') {
      query = query.orderBy('createdAt', options.sortOrder);
    } else {
      query = query.orderBy('createdAt', 'desc'); // default
    }

    const rows = await query
      .limit(options.limit)
      .offset(options.offset)
      .execute();

    return createPaginatedResponse(rows, total, options);
  }

  async findById(id: string) {
    const row = await db
      .selectFrom('examples')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) {
      throw new NotFoundError('Example not found');
    }

    return row;
  }
}
