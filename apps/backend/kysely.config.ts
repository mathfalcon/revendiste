import {defineConfig} from 'kysely-ctl';
import {db} from './src/db';
import {NODE_ENV} from './src/config/env';

export default defineConfig({
  destroyOnExit: true,
  kysely: db,
  migrations: {
    migrationFolder:
      NODE_ENV !== 'local' ? './dist/src/db/migrations' : './src/db/migrations',
    allowJS: NODE_ENV !== 'local',
  },
});
