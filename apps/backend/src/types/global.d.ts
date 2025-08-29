/// <reference types="@clerk/express/env" />

import {User} from './models';

declare global {
  namespace Express {
    interface Request {
      auth: AuthObject & {
        (options?: PendingSessionOptions): AuthObject;
      };
      user: User;
    }
  }
}
