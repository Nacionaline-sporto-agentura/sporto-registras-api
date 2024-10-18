'use strict';

import moleculer, { Context, RestSchema } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';

import authMixin from 'biip-auth-nodejs/mixin';
import _ from 'lodash';
import { NSA_GROUP_ID, RestrictionType } from '../types';
import { SN_ADMINS, SN_AUTH, SN_TENANTUSERS, SN_USERS } from '../types/serviceNames';
import { UserAuthMeta } from './api.service';
import { TenantUserRole } from './tenantUsers.service';
import { User, UserType } from './users.service';

function getAuthRest(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' = 'POST',
): RestSchema {
  return {
    method,
    fullPath: `/auth${path}`,
  };
}
function getApiRest(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' = 'GET',
): RestSchema {
  return {
    method,
    fullPath: `/api${path}`,
  };
}

@Service({
  name: SN_AUTH,
  mixins: [
    authMixin(process.env.AUTH_API_KEY, {
      host: process.env.AUTH_HOST,
      appHost: process.env.APP_HOST || 'https://registras.ltusportas.lt',
    }),
  ],

  actions: {
    login: {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/login'),
    },
    refreshToken: {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/refresh'),
    },
    'evartai.login': {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/evartai/login'),
    },
    'evartai.sign': {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/evartai/sign'),
    },
    remindPassword: {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/remind'),
    },
    changePasswordVerify: {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/verify'),
    },
    changePasswordAccept: {
      auth: RestrictionType.PUBLIC,
      rest: getAuthRest('/accept'),
    },
    'users.logout': {
      rest: getApiRest('/users/logout'),
    },
    'groups.list': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/groups'),
    },
    'groups.get': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/groups/:id'),
    },
    'groups.update': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/groups/:id', 'PATCH'),
    },
    'groups.create': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/groups', 'POST'),
    },
    'groups.remove': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/groups/:id', 'DELETE'),
    },
    'permissions.list': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/permissions'),
    },
    'permissions.get': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/permissions/:id'),
    },
    'permissions.update': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/permissions/:id', 'PATCH'),
    },
    'permissions.create': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/permissions', 'POST'),
    },
    'permissions.remove': {
      auth: RestrictionType.ADMIN,
      rest: getApiRest('/permissions/:id', 'DELETE'),
    },
  },
  hooks: {
    after: {
      login: 'afterUserLoggedIn',
      'evartai.login': 'afterUserLoggedIn',
      me: 'addProfiles',
      'permissions.create': 'cleanCache',
      'permissions.update': 'cleanCache',
      'permissions.remove': 'cleanCache',
    },
    before: {
      'evartai.login': 'beforeUserLogin',
      'groups.create': 'assignNsaAppIfNeeded',
      'groups.update': 'assignNsaAppIfNeeded',
    },
  },
})
export default class extends moleculer.Service {
  @Action({
    cache: {
      keys: ['#user.id'],
    },
    rest: getApiRest('/users/me'),
  })
  async me(ctx: Context<{}, UserAuthMeta>) {
    const data: any = ctx.meta.user;

    if (ctx.meta?.authUser?.permissions) {
      data.permissions = ctx.meta.authUser.permissions;
    }

    return data;
  }

  @Action({
    params: {
      id: 'number|convert',
    },
    rest: getApiRest('/groups/:id/users'),
  })
  async groupUsers(ctx: Context<{ id: number }, UserAuthMeta>) {
    return ctx.call(
      `${SN_ADMINS}.list`,
      _.merge({}, ctx.params, {
        query: {
          group: ctx.params.id,
        },
      }),
    );
  }

  @Action({
    cache: {
      keys: ['auth', '#user.id', '#profile.id'],
    },
    params: {
      auth: {
        type: 'array',
        items: 'string',
        enum: Object.values(RestrictionType),
      },
    },
  })
  async validateType(ctx: Context<{ auth: RestrictionType[] }, UserAuthMeta>) {
    const { auth } = ctx.params;
    const { user } = ctx.meta;
    const userType = user.type;
    const tenantRole = ctx.meta.profile?.role;
    if (!auth || !auth.length) return true;

    let result = false;
    if (auth.includes(RestrictionType.ADMIN)) {
      result = result || userType === UserType.ADMIN;
    }

    if (auth.includes(RestrictionType.USER)) {
      result = result || userType === UserType.USER;
    }

    if (tenantRole && auth.includes(RestrictionType.TENANT_ADMIN)) {
      result = result || tenantRole === TenantUserRole.ADMIN;
    }

    if (auth.includes(RestrictionType.TENANT_USER)) {
      result = result || !!ctx.meta.profile?.id;
    }

    return result;
  }

  @Action({
    params: {
      authUser: 'any',
      authUserGroups: 'array|optional',
    },
  })
  async createUserWithTenantsIfNeeded(ctx: Context<{ authUser: any; authUserGroups: any[] }>) {
    const { authUser, authUserGroups } = ctx.params;
    const user: User = await ctx.call(`${SN_USERS}.findOrCreate`, {
      authUser: authUser,
      update: true,
    });

    if (authUserGroups && authUserGroups.length && user?.id) {
      const authGroups = authUserGroups.filter((g) => g.id != NSA_GROUP_ID && !!g.companyCode);

      for (const group of authGroups) {
        await ctx.call(`${SN_TENANTUSERS}.createRelationshipsIfNeeded`, {
          authGroup: group,
          userId: user.id,
        });
      }
    }

    return user;
  }

  @Method
  async beforeUserLogin(ctx: any) {
    ctx.params = ctx.params || {};
    ctx.params.refresh = true;

    return ctx;
  }

  @Method
  async afterUserLoggedIn(_ctx: any, data: any) {
    if (!data || !data.token) return data;

    const meta = { authToken: data.token };

    const authUser: any = await this.broker.call(`${SN_AUTH}.users.resolveToken`, null, { meta });
    const authUserGroups: any = await this.broker.call(
      `${SN_AUTH}.users.get`,
      {
        id: authUser?.id,
        populate: 'groups',
      },
      { meta },
    );
    const authGroups: any[] = authUserGroups?.groups || [];

    await this.broker.call(
      `${SN_AUTH}.createUserWithTenantsIfNeeded`,
      {
        authUser: authUser,
        authUserGroups: authGroups,
      },
      { meta },
    );

    return data;
  }

  @Method
  async addProfiles(ctx: any, data: any) {
    if (data?.id && data?.type === UserType.USER) {
      data.profiles = await ctx.call(`${SN_TENANTUSERS}.getProfiles`);
      data.profiles = data.profiles.map((i: any) => ({
        id: i.id,
        name: i.name,
        email: i.email,
        phone: i.phone,
        role: i.role,
        tenantType: i.tenantType,
        data: i.data || {},
      }));
    }

    return data;
  }

  @Method
  assignNsaAppIfNeeded(ctx: Context<{ apps: Array<any>; parent?: number }, UserAuthMeta>) {
    const { apps, parent } = ctx.params;
    const nsaAppId = ctx.meta.app.id;

    if (!nsaAppId || !!parent) return ctx;

    if (!apps?.length) {
      ctx.params.apps = [nsaAppId];
      return ctx;
    }

    const hasNsaApp = apps.some((a) => a == nsaAppId);
    if (hasNsaApp) return ctx;

    ctx.params.apps = [...apps, nsaAppId];
    return ctx;
  }
  @Method
  async cleanCache() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }
  @Event()
  async 'clean.cache.auth'() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }
}
