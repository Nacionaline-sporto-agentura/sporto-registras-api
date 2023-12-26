import Moleculer, { Errors } from 'moleculer';
import { User } from '../services/users.service';
import { FieldHookCallback } from './';

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

export interface CommonFields {
  createdBy: User['id'];
  createdAt: Date;
  updatedBy: User['id'];
  updatedAt: Date;
  deletedBy: User['id'];
  detetedAt: Date;
}

export interface CommonPopulates {
  createdBy: User;
  updatedBy: User;
  deletedBy: User;
}

export const COMMON_FIELDS = {
  createdBy: {
    type: 'number',
    readonly: true,
    onCreate: ({ ctx }: FieldHookCallback) => ctx?.meta?.user?.id,
    populate: {
      action: 'users.resolve',
      params: {
        scope: false,
      },
    },
  },
  createdAt: {
    type: 'date',
    columnType: 'datetime',
    readonly: true,
    onCreate: () => new Date(),
  },
  updatedBy: {
    type: 'number',
    readonly: true,
    hidden: 'byDefault',
    onUpdate: ({ ctx }: FieldHookCallback) => ctx?.meta?.user?.id,
    populate: {
      action: 'users.resolve',
      params: {
        scope: false,
      },
    },
  },
  updatedAt: {
    type: 'date',
    columnType: 'datetime',
    hidden: 'byDefault',
    readonly: true,
    onUpdate: () => new Date(),
  },
  deletedBy: {
    type: 'number',
    readonly: true,
    onRemove: ({ ctx }: FieldHookCallback) => ctx?.meta?.user?.id,
    populate: {
      action: 'users.resolve',
      params: {
        scope: false,
      },
    },
  },
  deletedAt: {
    type: 'date',
    columnType: 'datetime',
    readonly: true,
    onRemove: () => new Date(),
  },
};

export const COMMON_SCOPES = {
  notDeleted: {
    deletedAt: { $exists: false },
  },
};

export function throwUnauthorizedError(message?: string): Errors.MoleculerError {
  throw new Moleculer.Errors.MoleculerClientError(message || `Unauthorized.`, 401, 'UNAUTHORIZED');
}

export function throwNotFoundError(message?: string): Errors.MoleculerError {
  throw new Moleculer.Errors.MoleculerClientError(message || `Not found.`, 404, 'NOT_FOUND');
}

export function throwNoRightsError(message?: string): Errors.MoleculerError {
  throw new Moleculer.Errors.MoleculerClientError(message || `No rights.`, 401, 'NO_RIGHTS');
}

export function throwValidationError(message?: string, data?: any): Errors.MoleculerError {
  throw new Moleculer.Errors.ValidationError(message || `Not valid.`, 'VALIDATION_ERROR', data);
}

export const COMMON_DEFAULT_SCOPES = ['notDeleted'];
export const COMMON_DELETED_SCOPES = ['-notDeleted', 'deleted'];

export const NSA_GROUP_ID = process.env.NSA_GROUP_ID;
