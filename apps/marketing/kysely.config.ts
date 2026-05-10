import {defineConfig} from 'kysely-ctl';
import {db} from './src/db/index';

export default defineConfig({
  destroyOnExit: true,
  kysely: db,
  migrations: {
    migrationFolder: './src/db/migrations',
    allowJS: false,
  },
});
