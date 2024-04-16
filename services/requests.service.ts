'use strict';
import * as jsonpatch from 'fast-json-patch';
import { Operation } from 'fast-json-patch';
import moleculer, { Context } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import _ from 'lodash';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  EntityChangedParams,
  FieldHookCallback,
  RestrictionType,
  TENANT_FIELD,
  Table,
} from '../types';
import { VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE } from '../utils';
import { UserAuthMeta } from './api.service';
import { RequestHistoryTypes } from './requests.histories.service';
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

export const SERVICE_BY_REQUEST_TYPE = {
  [RequestEntityTypes.SPORTS_BASES]: 'sportsBases',
};

const nonEditableStatuses = [RequestStatus.APPROVED, RequestStatus.REJECTED];

type JsonableObj = { [key: string]: Jsonable };
type JsonableArr = Jsonable[];
type Jsonable = JsonableArr | JsonableObj | string | number | boolean | null;

interface Fields extends CommonFields {
  id: number;
  status: RequestStatus;
  entityType: RequestEntityTypes;
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
      entityChangedOldEntity: true,
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
        immutable: true,
        enum: Object.values(RequestEntityTypes),
        default: RequestEntityTypes.SPORTS_BASES,
      },

      entity: {
        type: 'number',
        columnName: 'entityId',
        immutable: true,
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
    actions: {
      create: {
        auth: RestrictionType.USER,
      },
    },
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
      tasks(query: any, ctx: Context<null, UserAuthMeta>) {
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
    rest: 'GET /:id/history',
    params: {
      id: {
        type: 'number',
        convert: true,
      },
    },
  })
  async getHistory(
    ctx: Context<{
      id: number;
      type?: string;
      page?: number;
      pageSize?: number;
    }>,
  ) {
    return ctx.call(`requests.histories.${ctx.params.type || 'list'}`, {
      sort: '-createdAt',
      query: {
        request: ctx.params.id,
      },
      page: ctx.params.page,
      pageSize: ctx.params.pageSize,
      populate: 'createdBy',
    });
  }

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
        entity: { $exists: false },
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

  @Method
  createRequestHistory(ctx: Context, request: Request, type: string, data: any = {}) {
    const { comment } = ctx.options?.parentCtx?.params as any;
    return ctx.call('requests.histories.create', {
      request: request.id,
      changes: request.changes,
      comment,
      ...data,
      type,
    });
  }

  @Event()
  async 'requests.created'(ctx: Context<EntityChangedParams<Request>>) {
    const { data: request } = ctx.params;

    if (request.status === RequestStatus.CREATED) {
      await this.createRequestHistory(ctx, request, RequestHistoryTypes.CREATED);
    }
  }

  @Event()
  async 'requests.updated'(ctx: Context<EntityChangedParams<Request>>) {
    const { oldData, data } = ctx.params;

    if (data.status !== oldData.status) {
      const typesByStatus: any = {
        [RequestStatus.CREATED]: RequestHistoryTypes.CREATED,
        [RequestStatus.SUBMITTED]: RequestHistoryTypes.SUBMITTED,
        [RequestStatus.REJECTED]: RequestHistoryTypes.REJECTED,
        [RequestStatus.RETURNED]: RequestHistoryTypes.RETURNED,
        [RequestStatus.APPROVED]: RequestHistoryTypes.APPROVED,
      };

      await this.createRequestHistory(ctx, data, typesByStatus[data.status]);

      if (data.status === RequestStatus.APPROVED) {
        const request: Request<'entity'> = await this.resolveEntities(ctx, {
          id: data.id,
          populate: 'entity',
        });
        const oldEntity = request.entity;
        const entity = jsonpatch.applyPatch(oldEntity, request.changes, false, false).newDocument;

        const serviceName = SERVICE_BY_REQUEST_TYPE[request.entityType];

        const meta: Partial<UserAuthMeta> = {};

        if (request.createdBy) {
          meta.user = await ctx.call('users.resolve', { id: request.createdBy });
        }
        if (request.tenant) {
          meta.profile = await ctx.call('tenants.resolve', { id: request.tenant });
        }

        const entityWithId: { id: number } = await ctx.call(
          `${serviceName}.applyRequestChanges`,
          {
            entity,
            oldEntity,
          },
          {
            meta,
          },
        );

        if (!request.entity?.id) {
          await this.updateEntity(ctx, {
            id: request.id,
            entity: entityWithId.id,
          });
        }
      }
    }
  }

  @Event()
  async 'requests.removed'(ctx: Context<EntityChangedParams<Request>>) {
    const { data: request } = ctx.params;

    await this.createRequestHistory(ctx, request, RequestHistoryTypes.DELETED);
  }
}
