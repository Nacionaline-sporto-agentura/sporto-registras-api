'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Event, Service } from 'moleculer-decorators';

import _ from 'lodash';
import DbConnection from '../mixins/database.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  RestrictionType,
  throwNotFoundError,
  throwUnauthorizedError,
} from '../types';
import { SN_AUTH, SN_TENANTS, SN_TENANTUSERS, SN_USERS } from '../types/serviceNames';
import { UserAuthMeta } from './api.service';
import { Tenant } from './tenants/index.service';
import { User, UserType } from './users.service';

export enum TenantUserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface TenantUser extends CommonFields {
  id: number;
  tenant: number | Tenant;
  user: number | User;
  role: TenantUserRole;
}

@Service({
  name: SN_TENANTUSERS,

  mixins: [
    DbConnection({
      rest: false,
      collection: 'tenantUsers',
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
      tenant: {
        type: 'number',
        columnName: 'tenantId',
        immutable: true,
        required: true,
        populate: 'tenants.resolve',
      },

      user: {
        type: 'number',
        columnName: 'userId',
        immutable: true,
        required: true,
        populate: `${SN_USERS}.resolve`,
      },

      role: {
        type: 'string',
        enum: Object.values(TenantUserRole),
        default: TenantUserRole.USER,
      },

      ...COMMON_FIELDS,
    },

    scopes: {
      ...COMMON_SCOPES,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
})
export default class extends moleculer.Service {
  @Action({
    params: {
      tenant: 'number|convert',
      user: 'number|convert',
    },
  })
  async getRole(ctx: Context<{ tenant: number; user: number }>) {
    const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
      query: {
        tenant: ctx.params.tenant,
        user: ctx.params.user,
      },
      fields: ['role'],
    });

    return tenantUser?.role;
  }
  @Action({
    params: {
      tenantId: 'number|convert',
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_USER],

    rest: {
      method: 'GET',
      path: '/tenants/:tenantId/users',
      basePath: '/',
    },
  })
  async findByTenant(ctx: Context<{ tenantId: number }, UserAuthMeta>) {
    const { tenantId } = ctx.params;
    const tenant: Tenant = await ctx.call('tenants.resolve', {
      id: tenantId,
      throwIfNotExist: true,
    });

    delete ctx.params.tenantId;

    const params = _.merge({}, ctx.params || {}, {
      populate: 'role',
    });

    return ctx.call(`${SN_USERS}.list`, params, {
      meta: {
        profile: tenant,
      },
    });
  }

  @Action({
    params: {
      id: 'number|convert',
      tenantId: 'number|convert',
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_USER],

    rest: {
      method: 'GET',
      path: '/tenants/:tenantId/users/:id',
      basePath: '/',
    },
  })
  async getByTenant(ctx: Context<{ tenantId: number; id: number }, UserAuthMeta>) {
    const { tenantId } = ctx.params;
    const tenant: Tenant = await ctx.call('tenants.resolve', {
      id: tenantId,
      throwIfNotExist: true,
    });

    delete ctx.params.tenantId;

    const params = _.merge({}, ctx.params || {}, {
      populate: 'role',
    });

    return ctx.call(`${SN_USERS}.get`, params, {
      meta: {
        profile: tenant,
      },
    });
  }

  @Action({
    params: {
      id: 'number|convert',
    },
  })
  async findByUser(ctx: Context<{ id: number }>) {
    const tenantUsers: TenantUser[] = await ctx.call(`${SN_TENANTUSERS}.find`, {
      query: {
        user: ctx.params.id,
      },
      populate: 'tenant',
    });

    return tenantUsers.map((i) => ({
      ...(i.tenant as Tenant),
      role: i.role,
    }));
  }

  @Action({
    params: {
      id: 'number|convert',
      tenant: 'number|convert|optional',
    },
  })
  async findIdsByUser(ctx: Context<{ id: number; tenant: number }>) {
    const tenantUsers: TenantUser[] = await ctx.call(`${SN_TENANTUSERS}.find`, {
      query: {
        user: ctx.params.id,
        tenant: ctx.params.tenant,
      },
    });

    return tenantUsers.map((tu) => tu.tenant);
  }

  @Action({
    params: {
      id: 'number|convert',
      tenant: 'number|convert|optional',
    },
  })
  async findIdsByUserRecursive(ctx: Context<{ id: number; tenant: number }>) {
    const tenantIds = await this.actions.findIdsByUser(ctx.params);

    let parentIds = tenantIds;

    while (parentIds.length) {
      const childTenants: Tenant[] = await ctx.call('tenants.find', {
        query: {
          parent: { $in: parentIds },
        },
        scope: false,
      });

      const childIds = childTenants.map((t) => t.id);
      tenantIds.push(...childIds);
      parentIds = childIds;
    }

    return tenantIds;
  }

  @Action({
    params: {
      id: 'any', // number or object - {$in:[]}
      role: {
        type: 'string',
        optional: true,
      },
    },
  })
  async findIdsByTenant(ctx: Context<{ id: number; role?: string }>) {
    const { id, role } = ctx.params;

    const query: any = {
      tenant: id,
    };

    if (role) {
      query.role = role;
    }

    const tenantUsers: TenantUser[] = await ctx.call(`${SN_TENANTUSERS}.find`, {
      query,
    });

    return tenantUsers.map((tu) => tu.user);
  }

  @Action({
    params: {
      userId: 'number|convert',
      tenantId: 'number|convert',
    },
  })
  async userExistsInTenant(ctx: Context<{ userId: number; tenantId: number }>) {
    const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
      query: {
        tenant: ctx.params.tenantId,
        user: ctx.params.userId,
      },
    });

    return !!tenantUser?.id;
  }

  @Action({
    params: {
      authGroup: 'any',
      userId: 'number|convert',
      companyEmail: 'string|optional',
      companyPhone: 'string|optional',
      companyName: 'string|optional',
    },
  })
  async createRelationshipsIfNeeded(
    ctx: Context<{
      authGroup: any;
      userId: number;
      companyEmail?: string;
      companyPhone?: string;
      companyName?: string;
    }>,
  ) {
    const { authGroup, userId, companyEmail, companyPhone, companyName } = ctx.params;

    if (!authGroup?.id) return;

    const tenant: Tenant = await ctx.call('tenants.findOrCreate', {
      authGroup: authGroup,
      email: companyEmail,
      phone: companyPhone,
      name: companyName,
    });

    if (!tenant || !tenant.id) {
      throw new moleculer.Errors.MoleculerClientError(
        'Cannot create or update tenant.',
        401,
        'UNAUTHORIZED',
      );
    }

    const query = {
      tenant: tenant.id,
      user: userId,
    };

    const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
      query,
    });

    if (tenantUser && !!authGroup?.role && authGroup.role === tenantUser.role) return tenantUser;

    if (tenantUser?.id) {
      return ctx.call(`${SN_TENANTUSERS}.update`, {
        id: tenantUser.id,
        role: authGroup.role || TenantUserRole.USER,
      });
    }

    return ctx.call(`${SN_TENANTUSERS}.create`, {
      ...query,
      role: authGroup.role || TenantUserRole.USER,
    });
  }

  @Action({
    params: {
      userId: 'number|convert',
      tenantId: 'number|convert',
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
    rest: {
      method: 'DELETE',
      path: '/tenants/:tenantId/users/:userId',
      basePath: '/',
    },
  })
  async removeUser(ctx: Context<{ userId: number; tenantId: number }, UserAuthMeta>) {
    const { tenantId, userId } = ctx.params;
    const { profile } = ctx.meta;
    if (profile?.id && Number(profile?.id) !== tenantId) {
      throw new moleculer.Errors.MoleculerClientError(
        'Tenant is not accessable.',
        401,
        'UNAUTHORIZED',
      );
    }

    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id: userId, throwIfNotExist: true });
    const tenant: Tenant = await ctx.call('tenants.resolve', {
      id: tenantId,
      throwIfNotExist: true,
    });

    await this.removeEntities(
      ctx,
      {
        query: {
          tenant: tenant.id,
          user: user.id,
        },
      },
      { meta: ctx.meta },
    );

    await ctx.call(`${SN_AUTH}.users.unassignFromGroup`, {
      id: user.authUser,
      groupId: tenant.authGroup,
    });

    return { success: true };
  }

  @Action({
    params: {
      tenantId: 'number|convert',
    },
  })
  async removeUsers(ctx: Context<{ tenantId: number }, UserAuthMeta>) {
    const { tenantId } = ctx.params;
    const { profile } = ctx.meta;
    if (profile?.id && Number(profile?.id) !== tenantId) {
      throw new moleculer.Errors.MoleculerClientError(
        'Tenant is not accessable.',
        401,
        'UNAUTHORIZED',
      );
    }

    const tenant: Tenant = await ctx.call('tenants.resolve', {
      id: tenantId,
      throwIfNotExist: true,
    });

    const tenantUsers: TenantUser[] = await ctx.call(`${SN_TENANTUSERS}.find`, {
      query: {
        tenant: tenant.id,
      },
      populate: 'user',
    });

    await Promise.all(
      tenantUsers.map((tu) =>
        ctx.call(`${SN_AUTH}.users.unassignFromGroup`, {
          id: (tu.user as User).authUser,
          groupId: tenant.authGroup,
        }),
      ),
    );

    await this.removeEntities(
      ctx,
      {
        query: {
          tenant: tenant.id,
        },
      },
      { meta: ctx.meta },
    );

    return { success: true };
  }

  @Action({
    params: {
      userId: 'number|convert',
    },
  })
  async removeTenants(ctx: Context<{ userId: number }, UserAuthMeta>) {
    const { userId } = ctx.params;

    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id: userId, throwIfNotExist: true });

    const tenantUsers: TenantUser[] = await ctx.call(`${SN_TENANTUSERS}.find`, {
      query: {
        user: user.id,
      },
      populate: 'tenant',
    });

    await Promise.all(
      tenantUsers.map((tu) =>
        ctx.call(`${SN_AUTH}.users.unassignFromGroup`, {
          id: user.authUser,
          groupId: (tu.tenant as Tenant).authGroup,
        }),
      ),
    );

    await this.removeEntities(
      ctx,
      {
        query: {
          user: user.id,
        },
      },
      { meta: ctx.meta },
    );

    return { success: true };
  }

  @Action({
    params: {
      userId: 'number|convert',
      tenantId: 'number|convert',
      role: 'string',
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
    rest: {
      method: 'PATCH',
      path: '/tenants/:tenantId/users/:userId',
      basePath: '/',
    },
  })
  async updateUser(ctx: Context<{ userId: number; tenantId: number; role: string }, UserAuthMeta>) {
    const { profile } = ctx.meta;
    const { userId, tenantId, role } = ctx.params;
    if (
      profile?.id &&
      (Number(profile?.id) !== tenantId || profile?.role !== TenantUserRole.ADMIN)
    ) {
      throw new moleculer.Errors.MoleculerClientError(
        'Tenant is not accessable.',
        401,
        'UNAUTHORIZED',
      );
    }

    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id: userId, throwIfNotExist: true });
    const tenant: Tenant = await ctx.call('tenants.resolve', {
      id: tenantId,
      throwIfNotExist: true,
    });

    const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
      query: {
        tenant: tenant.id,
        user: user.id,
      },
    });

    if (!tenantUser || !tenantUser.id) {
      return throwNotFoundError('Tenant user not found.');
    }

    await ctx.call(`${SN_AUTH}.users.assignToGroup`, {
      id: user.authUser,
      groupId: tenant.authGroup,
      role,
    });

    await ctx.call(`${SN_TENANTUSERS}.update`, {
      id: tenantUser.id,
      role,
    });

    return { success: true };
  }

  @Action({
    params: {
      userId: 'number|convert',
      tenantId: 'number|convert',
      role: {
        type: 'string',
        optional: true,
        default: TenantUserRole.USER,
      },
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],

    rest: {
      method: 'POST',
      path: '/tenants/:tenantId/users/:userId',
      basePath: '/',
    },
  })
  async addUser(ctx: Context<{ userId: number; tenantId: number; role: string }, UserAuthMeta>) {
    const { profile } = ctx.meta;
    const { userId, tenantId, role } = ctx.params;

    if (profile?.id) {
      const availableTenantIds: number[] = await ctx.call(`${SN_TENANTS}.getAvailableTenantIds`, {
        id: profile.id,
      });

      const availableTenantIdsWithoutProfile = availableTenantIds?.filter((i) => i !== profile.id);

      const sameProfileEditing = profile.id === tenantId && profile.role === TenantUserRole.ADMIN;

      if (!sameProfileEditing && !availableTenantIdsWithoutProfile.includes(tenantId)) {
        return throwUnauthorizedError('Tenant is not accessable.');
      }
    }

    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id: userId, scope: '-tenant' });
    const tenant: Tenant = await ctx.call('tenants.resolve', { id: tenantId });

    if (!user || !tenant) {
      return throwNotFoundError('User/Tenant not found.');
    }

    const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
      query: {
        tenant: tenant.id,
        user: user.id,
      },
    });

    if (tenantUser?.id) {
      throw new moleculer.Errors.MoleculerClientError(
        'Tenant user already exists.',
        400,
        'BAD_REQUEST',
      );
    }

    await ctx.call(`${SN_AUTH}.users.assignToGroup`, {
      id: user.authUser,
      groupId: tenant.authGroup,
      role,
    });

    await ctx.call(`${SN_TENANTUSERS}.create`, {
      tenant: tenant.id,
      user: user.id,
      role,
    });

    return { success: true };
  }

  @Action({
    params: {
      id: 'number|convert',
      profile: 'number|convert',
    },
    cache: {
      keys: ['id', 'profile'],
    },
  })
  async getProfile(ctx: Context<{ id: number; profile: number }>) {
    const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
      query: {
        tenant: ctx.params.profile,
        user: ctx.params.id,
      },
      populate: 'tenant',
    });

    if (!tenantUser || !tenantUser.id) {
      return false;
    }

    const tenant: Tenant = tenantUser?.tenant as Tenant;
    if (tenantUser && tenantUser.role && tenant && tenant.id) {
      return { ...tenant, role: tenantUser.role };
    }

    return false;
  }

  @Action({
    cache: {
      keys: ['#user.id'],
    },
    rest: {
      method: 'GET',
      path: '/profiles',
      basePath: '/',
    },
  })
  async getProfiles(ctx: Context<{}, UserAuthMeta>) {
    const { user } = ctx.meta;
    if (!user?.id || user?.type === UserType.ADMIN) return [];

    const tenants: Tenant[] = await ctx.call(`${SN_TENANTUSERS}.findByUser`, { id: user.id });

    return tenants;
  }

  @Event()
  async [`${SN_TENANTUSERS}.**`]() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
    this.broker.emit('clean.cache.auth');
  }
}
