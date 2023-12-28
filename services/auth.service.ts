'use strict';

import moleculer, { Context, RestSchema } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';

import authMixin from 'biip-auth-nodejs/mixin';
import _ from 'lodash';
import { NSA_GROUP_ID, RestrictionType } from '../types';
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
  name: 'auth',
  mixins: [
    authMixin(process.env.AUTH_API_KEY, {
      host: process.env.AUTH_HOST || 'https://auth.registras.ltusportas.lt',
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
  },
  hooks: {
    after: {
      login: 'afterUserLoggedIn',
      'evartai.login': 'afterUserLoggedIn',
      me: 'addProfiles',
    },
    before: {
      'evartai.login': 'beforeUserLogin',
      'groups.create': 'assignNsaAppIfNeeded',
      'groups.update': 'assignNsaAppIfNeeded',
    },
  },
})
export default class AuthService extends moleculer.Service {
  @Action({
    cache: {
      keys: ['#user.id'],
    },
    rest: getApiRest('/users/me'),
  })
  async me(ctx: Context<{}, UserAuthMeta>) {
    return ctx.meta.user;
  }

  @Action({
    params: {
      id: 'number|convert',
    },
    rest: getApiRest('/groups/:id/users'),
  })
  async groupUsers(ctx: Context<{ id: number }, UserAuthMeta>) {
    const authGroup: any = await ctx.call('auth.groups.get', {
      id: ctx.params.id,
      populate: 'users',
    });

    delete ctx.params.id;

    const authUserIds = authGroup?.users?.map((u: any) => u.id) || [];
    return ctx.call(
      'admins.list',
      _.merge({}, ctx.params, {
        query: {
          authUser: { $in: authUserIds },
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
      authUserGroups: 'array',
    },
  })
  async createUserWithTenantsIfNeeded(ctx: Context<{ authUser: any; authUserGroups: any[] }>) {
    const { authUser, authUserGroups } = ctx.params;
    const user: User = await ctx.call('users.findOrCreate', {
      authUser: authUser,
      update: true,
    });

    if (authUserGroups && authUserGroups.length && user?.id) {
      const authGroups = authUserGroups.filter((g) => g.id != NSA_GROUP_ID);

      for (const group of authGroups) {
        await ctx.call('tenantUsers.createRelationshipsIfNeeded', {
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
  async afterUserLoggedIn(ctx: any, data: any) {
    if (!data || !data.token) return data;

    const meta = { authToken: data.token };

    const authUser: any = await this.broker.call('auth.users.resolveToken', null, { meta });
    const authUserGroups: any = await this.broker.call(
      'auth.users.get',
      {
        id: authUser?.id,
        populate: 'groups',
      },
      { meta },
    );
    const authGroups: any[] = authUserGroups?.groups || [];

    await this.broker.call(
      'auth.createUserWithTenantsIfNeeded',
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
      data.profiles = await ctx.call('tenantUsers.getProfiles');
      data.profiles = data.profiles.map((i: any) => ({
        id: i.id,
        name: i.name,
        freelancer: i.freelancer,
        email: i.email,
        phone: i.phone,
        role: i.role,
      }));
    }

    return data;
  }

  @Method
  assignNsaAppIfNeeded(ctx: Context<{ apps: Array<any> }, UserAuthMeta>) {
    const { apps } = ctx.params;
    const nsaAppId = ctx.meta.app.id;
    if (!apps || !apps.length || !nsaAppId) return ctx;

    const hasNsaApp = apps.some((a) => a == nsaAppId);
    if (hasNsaApp) return ctx;

    ctx.params.apps = [...apps, nsaAppId];
    return ctx;
  }

  @Event()
  async 'clean.cache.auth'() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }
}
