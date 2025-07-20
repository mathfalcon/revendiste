import express from 'express';
import {
  Route,
  Get,
  Tags,
  Middlewares,
  Request,
  Queries,
  Body,
  Post,
} from '@tsoa/runtime';
import {ExampleService} from '~/services';
import {Params, ValidateParams} from '~/decorators';
import {
  ensurePagination,
  paginationMiddleware,
  PaginationQuery,
} from '~/middleware';
import {
  GetExampleByIdRouteParams,
  GetExampleByIdRouteSchema,
} from './validation';
import z from 'zod';

export const MyValidator = z.object({
  result: z.object({
    price: z.string().nonempty(),
  }),
  code: z.number(),
  msg: z.string().nonempty(),
});
export type MyResponse = z.infer<typeof MyValidator>;

@Route('examples')
@Tags('Example')
export class ExampleController {
  private service = new ExampleService();

  @Get('/')
  public async getAll() {
    return this.service.getAllExamples();
  }

  @Post('/paginated')
  @Middlewares(paginationMiddleware(10, 100))
  @Middlewares(ensurePagination)
  public async getAllPaginated(
    @Queries() query: PaginationQuery,
    @Request() request: express.Request,
    @Body() body: PaginationQuery,
  ) {
    return this.service.getAllExamplesPaginated({
      pagination: request.pagination!,
    });
  }

  @Get('/:id')
  @ValidateParams(GetExampleByIdRouteSchema)
  public async getOne(@Params() id: GetExampleByIdRouteParams['id']) {
    return this.service.getExample({id});
  }
}
