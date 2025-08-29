import {Selectable} from 'kysely';
import {Users} from './db';

export type User = Selectable<Users>;
