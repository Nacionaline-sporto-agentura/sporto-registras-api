'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';

import DbConnection, { PopulateHandlerFn } from '../mixins/database.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  FieldHookCallback,
  RestrictionType,
  throwNotFoundError,
  throwUnauthorizedError,
} from '../types';
import { UserAuthMeta } from './api.service';
import { TenantUser, TenantUserRole } from './tenantUsers.service';
import { User, UserType } from './users.service';

export interface Tenant extends CommonFields {
  id: number;
  name: string;
  role?: TenantUserRole;
  authGroup?: number;
  parent: number;
}

export enum TenantTenantType {
  MUNICIPALITY = 'MUNICIPALITY',
  ORGANIZATION = 'ORGANIZATION',
}

@Service({
  name: 'tenants',

  mixins: [
    DbConnection({
      collection: 'tenants',
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

      name: 'string',

      email: 'string',

      phone: 'string',

      code: 'string',

      authGroup: {
        type: 'number',
        columnType: 'integer',
        columnName: 'authGroupId',
        populate: 'auth.groups.get',
        async onRemove({ ctx, entity }: FieldHookCallback) {
          await ctx.call('auth.groups.remove', { id: entity.authGroupId }, { meta: ctx?.meta });
        },
      },

      tenantType: {
        type: 'string',
        enum: Object.values(TenantTenantType),
        default: TenantTenantType.ORGANIZATION,
      },

      type: 'string',
      legalForm: 'string',
      address: 'string',
      data: {
        type: 'object',
        properties: {
          url: 'string',
          foundedAt: 'date',
          hasBeneficiaryStatus: 'boolean',
          nonGovernmentalOrganization: 'boolean',
          nonFormalEducation: 'boolean',
        },
      },

      role: {
        virtual: true,
        type: TenantUserRole,
        populate(ctx: any, _values: any, tenants: any[]) {
          return Promise.all(
            tenants.map(async (tenant: any) => {
              if (!ctx.meta.user?.id) return;
              const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
                query: {
                  tenant: tenant.id,
                  user: ctx.meta.user.id,
                },
              });
              return tenantUser?.role;
            }),
          );
        },
      },

      parent: {
        type: 'number',
        columnType: 'integer',
        columnName: 'parentId',
        populate: 'tenants.resolve',
      },

      children: {
        virtual: true,
        type: 'array',
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('tenants.populateByProp'),
          inheritPopulate: true,
          params: {
            sort: 'name',
            mappingMulti: true,
            queryKey: 'parent',
            populate: 'children',
          },
        },
      },

      ...COMMON_FIELDS,
    },

    scopes: {
      ...COMMON_SCOPES,
      noParent(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        // TODO: apply for visible subtenants for users
        if (!params?.id && !query?.parent) {
          query.parent = { $exists: false };
        }
        return query;
      },
      async user(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        if (ctx?.meta?.user?.type === UserType.USER) {
          const tenantsIds: number[] = await ctx.call('tenantUsers.findIdsByUserRecursive', {
            id: ctx.meta.user.id,
          });

          if (params?.id) {
            let hasPermissions = false;
            if (Array.isArray(params.id)) {
              hasPermissions = params.id.every((id: number) => tenantsIds.includes(Number(id)));
            } else {
              hasPermissions = tenantsIds.includes(Number(params.id));
            }
            if (!hasPermissions) {
              throwUnauthorizedError(`Cannot access this tenant with ID: ${params.id}`);
            }
          } else {
            query.id = { $in: tenantsIds };
          }
        }
        return query;
      },
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES, 'user', 'noParent'],
  },

  actions: {
    create: {
      rest: null,
    },

    update: {
      auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
    },

    remove: {
      rest: null,
      auth: RestrictionType.ADMIN,
    },
  },
})
export default class TenantsService extends moleculer.Service {
  @Action({
    params: {
      authGroup: 'any',
      email: 'string|optional',
      phone: 'string|optional',
      name: 'string|optional',
      parent: 'number|optional|convert',
      update: {
        type: 'boolean',
        optional: true,
        default: false,
      },
    },
  })
  async findOrCreate(
    ctx: Context<{
      authGroup: any;
      update?: boolean;
      name?: string;
      phone?: string;
      email?: string;
      parent?: number;
    }>,
  ) {
    const { authGroup, update, name, phone, email, parent } = ctx.params;
    if (!authGroup || !authGroup.id) return;

    const tenant: Tenant = await ctx.call('tenants.findOne', {
      query: {
        authGroup: authGroup.id,
      },
    });

    if (!update && tenant && tenant.id) return tenant;

    const dataToSave = {
      name: name || authGroup.name,
      email: email || authGroup.companyEmail,
      phone: phone || authGroup.companyPhone,
      code: authGroup.companyCode,
    };

    if (tenant && tenant.id) {
      return ctx.call('tenants.update', {
        id: tenant.id,
        ...dataToSave,
      });
    }

    return ctx.call('tenants.create', {
      authGroup: authGroup.id,
      parent,
      ...dataToSave,
    });
  }

  @Action({
    rest: 'POST /',
    params: {
      personalCode: 'string|optional',
      firstName: 'string|optional',
      lastName: 'string|optional',
      email: 'string|optional',
      phone: 'string|optional',
      companyName: 'string',
      companyCode: 'string',
      companyPhone: 'string',
      companyEmail: 'string',
      parent: 'number|optional|convert',
    },
    types: RestrictionType.ADMIN,
  })
  async invite(
    ctx: Context<
      {
        personalCode: any;
        phone: string;
        email: string;
        companyCode: string;
        companyName: string;
        firstName: string;
        lastName: string;
        companyEmail: string;
        companyPhone: string;
        parent: number;
      },
      UserAuthMeta
    >,
  ) {
    const {
      personalCode,
      email,
      companyCode,
      companyName,
      phone,
      firstName,
      lastName,
      companyEmail,
      companyPhone,
      parent,
    } = ctx.params;

    const authGroup: any = await ctx.call('auth.users.invite', { companyCode });

    if (personalCode) {
      const authUser: any = await ctx.call('auth.users.invite', {
        companyId: authGroup.id,
        personalCode: personalCode,
        role: TenantUserRole.ADMIN,
        notify: [email],
      });

      const user: User = await ctx.call('users.findOrCreate', {
        authUser,
        firstName,
        lastName,
        email,
        phone,
      });

      const tenantUser: TenantUser = await ctx.call('tenantUsers.createRelationshipsIfNeeded', {
        companyName,
        authGroup,
        companyEmail,
        companyPhone,
        userId: user.id,
      });

      return ctx.call('tenants.resolve', { id: tenantUser.tenant });
    }

    return ctx.call('tenants.findOrCreate', {
      authGroup: authGroup,
      email: companyEmail,
      phone: companyPhone,
      name: companyName,
      parent,
    });
  }

  @Action({
    rest: 'DELETE /:id',
    params: {
      id: 'number|convert',
    },
    types: RestrictionType.ADMIN,
  })
  async removeTenant(
    ctx: Context<
      {
        id: number;
      },
      UserAuthMeta
    >,
  ) {
    const { id } = ctx.params;

    const tenant: Tenant = await ctx.call('tenants.get', { id });
    if (!tenant) {
      return throwNotFoundError('Tenant not found.');
    }

    await ctx.call('tenantUsers.removeUsers', {
      tenantId: tenant.id,
    });

    await ctx.call('tenants.remove', { id: tenant.id });

    return {
      success: true,
    };
  }
}
