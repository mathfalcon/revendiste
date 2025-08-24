import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';

import {PORT} from './config/env';
import {errorHandler} from './middleware/errorHandler';
import {registerSwaggerRoutes} from './swagger';
import {RegisterRoutes} from './routes';
import {logger} from './utils';

const app: express.Application = express();

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json());

registerSwaggerRoutes(app);
RegisterRoutes(app);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 API listening on http://localhost:${PORT}/api`);
});

export default app;
