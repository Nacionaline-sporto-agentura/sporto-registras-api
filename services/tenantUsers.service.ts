'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Event, Service } from 'moleculer-decorators';

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
import { UserAuthMeta } from './api.service';
import { Tenant } from './tenants.service';
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
  name: 'tenantUsers',

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
        populate: 'users.resolve',
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
export default class TenantUsersService extends moleculer.Service {
  @Action({
    params: {
      tenant: {
        type: 'number',
        convert: true,
      },
      user: {
        type: 'number',
        convert: true,
      },
    },
  })
  async getRole(ctx: Context<{ tenant: number; user: number }>) {
    const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
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
      id: {
        type: 'number',
        convert: true,
      },
      filter: {
        type: 'any',
        optional: true,
      },
      query: {
        type: 'any',
        optional: true,
      },
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],

    rest: {
      method: 'GET',
      path: '/tenants/:id/users',
      basePath: '/',
    },
  })
  async findByTenant(ctx: Context<{ id: number; query?: any; filter?: any }, UserAuthMeta>) {
    const { id, query, filter } = ctx.params;
    const tenant: Tenant = await ctx.call('tenants.get', { id });
    if (!tenant || !tenant.id) {
      return throwNotFoundError('Tenant not found.');
    }

    return ctx.call(
      'users.list',
      {
        query,
        filter,
        populate: 'role',
      },
      {
        meta: {
          profile: ctx.meta.profile || tenant,
        },
      },
    );
  }

  @Action({
    params: {
      id: {
        type: 'number',
        convert: true,
      },
      userId: {
        type: 'number',
        convert: true,
      },
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],

    rest: {
      method: 'GET',
      path: '/tenants/:id/users/:userId',
      basePath: '/',
    },
  })
  async getByTenant(
    ctx: Context<{ id: number; userId: number; query?: any; filter?: any }, UserAuthMeta>,
  ) {
    const { id, query, filter, userId } = ctx.params;
    const tenant: Tenant = await ctx.call('tenants.get', { id });
    if (!tenant || !tenant.id) {
      return throwNotFoundError('Tenant not found.');
    }

    return ctx.call(
      'users.get',
      {
        id: userId,
        query,
        filter,
        populate: 'role',
      },
      {
        meta: {
          profile: ctx.meta.profile || tenant,
        },
      },
    );
  }

  @Action({
    params: {
      id: {
        type: 'number',
        convert: true,
      },
    },
  })
  async findByUser(ctx: Context<{ id: number }>) {
    const tenantUsers: TenantUser[] = await ctx.call('tenantUsers.find', {
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
      id: {
        type: 'number',
        convert: true,
      },
    },
  })
  async findIdsByUser(ctx: Context<{ id: number }>) {
    const tenantUsers: TenantUser[] = await ctx.call('tenantUsers.find', {
      query: {
        user: ctx.params.id,
      },
    });

    return tenantUsers.map((tu) => tu.tenant);
  }

  @Action({
    params: {
      id: {
        type: 'number',
        convert: true,
      },
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

    const tenantUsers: TenantUser[] = await ctx.call('tenantUsers.find', {
      query,
    });

    return tenantUsers.map((tu) => tu.user);
  }

  @Action({
    params: {
      userId: {
        type: 'number',
        convert: true,
      },
      tenantId: {
        type: 'number',
        convert: true,
      },
    },
  })
  async userExistsInTenant(ctx: Context<{ userId: number; tenantId: number }>) {
    const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
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
      userId: {
        type: 'number',
        convert: true,
      },
      companyEmail: {
        type: 'string',
        optional: true,
      },
      companyPhone: {
        type: 'string',
        optional: true,
      },
      companyName: {
        type: 'string',
        optional: true,
      },
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

    const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
      query,
    });

    if (tenantUser && !!authGroup?.role && authGroup.role === tenantUser.role) return tenantUser;

    if (tenantUser?.id) {
      return ctx.call('tenantUsers.update', {
        id: tenantUser.id,
        role: authGroup.role || TenantUserRole.USER,
      });
    }

    return ctx.call('tenantUsers.create', {
      ...query,
      role: authGroup.role || TenantUserRole.USER,
    });
  }

  @Action({
    params: {
      userId: {
        type: 'number',
        convert: true,
      },
      tenantId: {
        type: 'number',
        convert: true,
      },
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

    const user: User = await ctx.call('users.get', { id: userId });
    const tenant: Tenant = await ctx.call('tenants.get', { id: tenantId });
    if (!user || !tenant) {
      return throwNotFoundError('User/Tenant not found.');
    }

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

    await ctx.call('auth.users.unassignFromGroup', {
      id: user.authUser,
      groupId: tenant.authGroup,
    });

    return { success: true };
  }

  @Action({
    params: {
      tenantId: {
        type: 'number',
        convert: true,
      },
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

    const tenant: Tenant = await ctx.call('tenants.get', { id: tenantId });
    if (!tenant) {
      return throwNotFoundError('Tenant not found.');
    }

    const tenantUsers: TenantUser[] = await ctx.call('tenantUsers.find', {
      query: {
        tenant: tenant.id,
      },
      populate: 'user',
    });

    await Promise.all(
      tenantUsers.map((tu) =>
        ctx.call('auth.users.unassignFromGroup', {
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
      userId: {
        type: 'number',
        convert: true,
      },
    },
  })
  async removeTenants(ctx: Context<{ userId: number }, UserAuthMeta>) {
    const { userId } = ctx.params;

    const user: User = await ctx.call('users.get', { id: userId });
    if (!user) {
      return throwNotFoundError('User not found.');
    }

    const tenantUsers: TenantUser[] = await ctx.call('tenantUsers.find', {
      query: {
        user: user.id,
      },
      populate: 'tenant',
    });

    await Promise.all(
      tenantUsers.map((tu) =>
        ctx.call('auth.users.unassignFromGroup', {
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
      userId: {
        type: 'number',
        convert: true,
      },
      tenantId: {
        type: 'number',
        convert: true,
      },
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

    const user: User = await ctx.call('users.get', { id: userId });
    const tenant: Tenant = await ctx.call('tenants.get', { id: tenantId });
    if (!user || !tenant) {
      return throwNotFoundError('User/Tenant not found.');
    }

    const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
      query: {
        tenant: tenant.id,
        user: user.id,
      },
    });

    if (!tenantUser || !tenantUser.id) {
      return throwNotFoundError('Tenant user not found.');
    }

    await ctx.call('auth.users.assignToGroup', {
      id: user.authUser,
      groupId: tenant.authGroup,
      role,
    });

    await ctx.call('tenantUsers.update', {
      id: tenantUser.id,
      role,
    });

    return { success: true };
  }

  @Action({
    params: {
      userId: {
        type: 'number',
        convert: true,
      },
      tenantId: {
        type: 'number',
        convert: true,
      },
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
    if (
      profile?.id &&
      (Number(profile?.id) !== tenantId || profile?.role !== TenantUserRole.ADMIN)
    ) {
      return throwUnauthorizedError('Tenant is not accessable.');
    }

    const user: User = await ctx.call('users.resolve', { id: userId });
    const tenant: Tenant = await ctx.call('tenants.resolve', { id: tenantId });
    if (!user || !tenant) {
      return throwNotFoundError('User/Tenant not found.');
    }

    const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
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

    await ctx.call('auth.users.assignToGroup', {
      id: user.authUser,
      groupId: tenant.authGroup,
      role,
    });

    await ctx.call('tenantUsers.create', {
      tenant: tenant.id,
      user: user.id,
      role,
    });

    return { success: true };
  }

  @Action({
    params: {
      id: {
        type: 'number',
        convert: true,
      },
      profile: {
        type: 'number',
        convert: true,
      },
    },
    cache: {
      keys: ['id', 'profile'],
    },
  })
  async getProfile(ctx: Context<{ id: number; profile: number }>) {
    const tenantUser: TenantUser = await ctx.call('tenantUsers.findOne', {
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

    const tenants: Tenant[] = await ctx.call('tenantUsers.findByUser', {
      id: user.id,
      fields: ['id', 'name', 'role'],
    });

    return [
      {
        id: 'freelancer',
        name: `${user.firstName} ${user.lastName}`,
        freelancer: true,
        email: user.email,
      },
      ...tenants,
    ];
  }

  @Event()
  async 'tenantUsers.**'() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
    this.broker.emit('clean.cache.auth');
  }
}
