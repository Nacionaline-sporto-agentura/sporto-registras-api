import Moleculer, { Errors } from 'moleculer';
import { FieldHookCallback } from './';

export enum AuthUserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum RestrictionType {
  // DEFAULT = USER or ADMIN
  DEFAULT = 'DEFAULT',
  USER = 'USER',
  ADMIN = 'ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER = 'TENANT_USER',
  PUBLIC = 'PUBLIC',
}

export type Table<
  Fields = {},
  Populates = {},
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Pick<Omit<Fields, P> & Pick<Populates, P>, Extract<P | Exclude<keyof Fields, P>, F>>;

export const TENANT_FIELD = {
  tenant: {
    type: 'number',
    columnType: 'integer',
    columnName: 'tenantId',
    readonly: true,
    populate: 'tenants.resolve',
    onCreate: ({ ctx }: FieldHookCallback) => ctx.meta.profile?.id,
  },
};

export const TYPE_ID_OR_OBJECT_WITH_ID = {
  type: 'multi',
  rules: [
    { type: 'number' },
    {
      type: 'object',
      properties: {
        id: 'number',
      },
    },
  ],
  set: ({ value }: FieldHookCallback) => value?.id || value,
};

export const TYPE_MULTI_ID_OR_OBJECT_WITH_ID = {
  type: 'array',
  items: {
    type: 'multi',
    rules: [
      { type: 'number' },
      {
        type: 'object',
        properties: {
          id: 'number',
        },
      },
    ],
  },
  set: ({ value }: FieldHookCallback) => value?.map((v: any) => v?.id || v),
};

export const COMMON_SCOPES = {
  notDeleted: {
    deletedAt: { $exists: false },
  },
};

export function throwUnauthorizedError(message?: string): Errors.MoleculerError {
  throw new Moleculer.Errors.MoleculerClientError(message || `Unauthorized.`, 401, 'UNAUTHORIZED');
}

export function throwNotFoundError(message?: string, data?: any): Errors.MoleculerError {
  throw new Moleculer.Errors.MoleculerClientError(message || `Not found.`, 404, 'NOT_FOUND', data);
}

export function throwNoRightsError(message?: string): Errors.MoleculerError {
  throw new Moleculer.Errors.MoleculerClientError(message || `No rights.`, 403, 'NO_RIGHTS');
}

export function throwValidationError(message?: string, data?: any): Errors.MoleculerError {
  throw new Moleculer.Errors.ValidationError(message || `Not valid.`, 'VALIDATION_ERROR', data);
}

export const COMMON_DEFAULT_SCOPES = ['notDeleted'];
export const COMMON_DELETED_SCOPES = ['-notDeleted', 'deleted'];

export const ONLY_GET_REST_ENABLED: { [key: string]: { rest: any } } = {
  create: {
    rest: null,
  },
  update: {
    rest: null,
  },
  remove: {
    rest: null,
  },
  count: {
    rest: null,
  },
};

export const ACTIONS_MUTATE_ADMIN_ONLY = {
  create: {
    auth: RestrictionType.ADMIN,
  },
  update: {
    auth: RestrictionType.ADMIN,
  },
  remove: {
    auth: RestrictionType.ADMIN,
  },
};

export const GET_REST_ONLY_ACCESSIBLE_TO_ADMINS: { [key: string]: { rest: any } } = {
  // get: {
  //   rest: {
  //   // NE `rest.auth` o tiesiog `auth` turi buti
  //     auth: RestrictionType.ADMIN,
  //   },
  // },
  // list: {
  //   rest: {
  //     auth: RestrictionType.ADMIN,
  //   },
  // },
};

export const NSA_GROUP_ID = process.env.NSA_GROUP_ID;

export enum DateFormats {
  YEAR = 'YYYY',
  DAY = 'YYYY-MM-DD',
}
