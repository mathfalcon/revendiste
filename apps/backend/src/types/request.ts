import {Request} from 'express';
import z from 'zod';
import {ValidationSchema} from '~/middleware/validation';

export type TypedRequest<T extends ValidationSchema> = Request & z.infer<T>;
