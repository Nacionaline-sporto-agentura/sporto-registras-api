'use strict';

import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import { COMMON_DEFAULT_SCOPES, COMMON_FIELDS, COMMON_SCOPES, RestrictionType } from '../types';

import DbConnection from '../mixins/database.mixin';

export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

@Service({
  name: 'users',
  mixins: [
    DbConnection({
      collection: 'users',
      entityChangedOldEntity: true,
      createActions: {
        createMany: false,
      },
    }),
  ],

  settings: {
    auth: RestrictionType.ADMIN,
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      firstName: 'string',
      lastName: 'string',
      ...COMMON_FIELDS,
    },
    scopes: {
      ...COMMON_SCOPES,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
})
export default class UsersService extends moleculer.Service {}
