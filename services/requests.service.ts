'use strict';
import { Operation } from 'fast-json-patch';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import _ from 'lodash';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  TENANT_FIELD,
  Table,
} from '../types';
import { VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE } from '../utils';
import { UserAuthMeta } from './api.service';
import { SportsBase } from './sportsBases.service';
import { Tenant } from './tenants.service';
import { User, UserType } from './users.service';

export enum RequestStatus {
  DRAFT = 'DRAFT', // juodrastis
  CREATED = 'CREATED', // pateikta
  SUBMITTED = 'SUBMITTED', // pakartotinai pateikta
  APPROVED = 'APPROVED', // patvirtinta
  REJECTED = 'REJECTED', // atmesta
  RETURNED = 'RETURNED', // grazinta taisyti
}

const userEditStatuses = [RequestStatus.DRAFT, RequestStatus.RETURNED];
const adminEditStatuses = [RequestStatus.CREATED, RequestStatus.SUBMITTED];

export enum RequestEntityTypes {
  SPORTS_BASES = 'SPORTS_BASES',
}
const nonEditableStatuses = [RequestStatus.APPROVED, RequestStatus.REJECTED];

type JsonableObj = { [key: string]: Jsonable };
type JsonableArr = Jsonable[];
type Jsonable = JsonableArr | JsonableObj | string | number | boolean | null;

interface Fields extends CommonFields {
  id: number;
  status: RequestStatus;
  entityType: 'sportsBases';
  entity: SportsBase['id'];
  changes: Operation[];
  tenant: Tenant['id'];
}

interface Populates extends CommonPopulates {
  entity: SportsBase<'spaces'>;
  tenant: Tenant;
}

export type Request<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

const populatePermissions = (field: string) => {
  return function (ctx: Context<{}, UserAuthMeta>, _values: any, requests: any[]) {
    const { user, profile } = ctx?.meta;
    return requests.map((request: any) => {
      const editingPermissions = this.hasPermissionToEdit(request, user, profile);
      return !!editingPermissions[field];
    });
  };
};

@Service({
  name: 'requests',
  mixins: [
    DbConnection({
      collection: 'requests',
    }),
  ],
  settings: {
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },

      status: {
        type: 'string',
        enum: Object.values(RequestStatus),
        default: RequestStatus.DRAFT,
        validate: 'validateStatus',
      },

      entityType: {
        type: 'string',
        enum: Object.values(RequestEntityTypes),
        default: RequestEntityTypes.SPORTS_BASES,
      },

      entity: {
        type: 'number',
        columnName: 'entityId',
        async populate(
          ctx: Context,
          _values: Request['entity'][],
          entities: Array<Request & { entityId: Request['entity'] }>,
        ) {
          return Promise.all(
            entities.map(async (request) => {
              if (!request.entityId) return {};
              // TODO: populate based on type
              return ctx.call('sportsBases.resolve', {
                id: request.entityId,
                populate: ['owners', 'tenants', 'investments', 'spaces'],
              });
            }),
          );
        },
      },

      changes: {
        type: 'array',
        default: [],
      },

      canEdit: {
        type: 'boolean',
        virtual: true,
        populate: populatePermissions('edit'),
      },

      canValidate: {
        type: 'boolean',
        virtual: true,
        populate: populatePermissions('validate'),
      },

      ...TENANT_FIELD,
      ...COMMON_FIELDS,
    },
    defaultPopulates: ['canEdit', 'canValidate'],
    defaultScopes: [
      ...COMMON_DEFAULT_SCOPES,
      ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.names,
      'invisibleDraftsForAdmins',
    ],
    scopes: {
      ...COMMON_SCOPES,
      ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.scopes,
      invisibleDraftsForAdmins(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        const { user } = ctx?.meta;
        if (user?.type !== UserType.ADMIN) return query;

        if (query.status) {
          query.status = { $and: [query.status, { $ne: RequestStatus.DRAFT }] };
        } else {
          query.status = { $ne: RequestStatus.DRAFT };
        }

        return query;
      },
      tasks(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        const { user } = ctx?.meta;
        if (!user?.id) return query;

        const tasksQuery = this.getTasksQuery(user, query.status);
        return { ...query, ...tasksQuery };
      },
    },
  },
})
export default class RequestsServices extends moleculer.Service {
  @Action({
    rest: 'GET /tasks',
  })
  async listTasks(ctx: Context<{}>) {
    return ctx.call('requests.list', {
      ...ctx.params,
      sort: 'updatedAt,createdAt',
      scope: 'tasks',
    });
  }

  @Action({
    rest: 'GET /new',
  })
  async listNewRequests(ctx: Context<{}>) {
    const params = _.merge({}, ctx.params, {
      query: {
        entity: { $exists: true },
      },
    });

    return ctx.call('requests.list', {
      ...params,
      sort: 'updatedAt,createdAt',
    });
  }

  @Method
  hasPermissionToEdit(
    request: Request,
    user?: User,
    profile?: Tenant,
  ): {
    edit: boolean;
    validate: boolean;
  } {
    const invalid = { edit: false, validate: false };

    const tenant = request.tenant || (request as any).tenantId;

    if (!request?.id || nonEditableStatuses.includes(request?.status)) {
      return invalid;
    }

    if (!user?.id) {
      return {
        edit: true,
        validate: true,
      };
    }

    const isCreatedByUser = !tenant && user?.id === request.createdBy;
    const isCreatedByTenant = profile?.id === tenant;

    if (isCreatedByTenant || isCreatedByUser) {
      return {
        edit: userEditStatuses.includes(request.status),
        validate: false,
      };
    } else if (user.type === UserType.ADMIN) {
      return {
        edit: false,
        validate: adminEditStatuses.includes(request.status),
      };
    }
    return invalid;
  }

  @Method
  getTasksQuery(user: User, status?: string) {
    if (!user?.id) return {};

    const statusFilters: string[] =
      user.type === UserType.ADMIN ? adminEditStatuses : userEditStatuses;

    if (!status || !statusFilters.includes(status)) {
      return { status: { $in: statusFilters } };
    }

    return {};
  }

  @Method
  validateStatus({ ctx, value, entity }: FieldHookCallback) {
    const { user, profile } = ctx.meta;
    if (!value || !user?.id) return true;

    const error = `Cannot set status with value ${value}`;
    if (!entity?.id) {
      return [RequestStatus.CREATED, RequestStatus.DRAFT].includes(value) || error;
    }

    const editingPermissions = this.hasPermissionToEdit(entity, user, profile);

    if (editingPermissions.edit) {
      // TODO: disable other statuses to be converted to drafts
      return [RequestStatus.SUBMITTED, RequestStatus.DRAFT].includes(value) || error;
    } else if (editingPermissions.validate) {
      return (
        [RequestStatus.REJECTED, RequestStatus.RETURNED, RequestStatus.APPROVED].includes(value) ||
        error
      );
    }

    return error;
  }
}
