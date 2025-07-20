import {ExampleRepository} from '~/repositories';
import {WithPagination} from '~/types/pagination';
import {GetExampleByIdDto} from './dtos';

export class ExampleService {
  private repository = new ExampleRepository();

  async getAllExamples() {
    return this.repository.findAll();
  }

  async getAllExamplesPaginated(args: WithPagination<{}>) {
    return this.repository.findAllPaginated(args.pagination);
  }

  async getExample(args: GetExampleByIdDto) {
    return this.repository.findById(args.id);
  }
}
