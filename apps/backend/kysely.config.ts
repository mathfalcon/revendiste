import { defineConfig } from "kysely-ctl";
import { db } from "./src/db";

export default defineConfig({
  destroyOnExit: true,
  kysely: db,
  migrations: {
    migrationFolder: "./src/db/migrations",
  },
});