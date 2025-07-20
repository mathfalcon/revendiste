import { PaginationOptions } from "./types/pagination";

declare global {
    namespace Express {
      interface Request {
        pagination?: PaginationOptions
      }
    }
  }