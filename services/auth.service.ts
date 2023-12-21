'use strict';

import moleculer, { Context, RestSchema } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';

import authMixin from 'biip-auth-nodejs/mixin';
import { RestrictionType } from '../types';
import { UserAuthMeta } from './api.service';

function getAuthRest(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' = 'POST',
): RestSchema {
  return {
    method,
    fullPath: `/auth${path}`,
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
  },
})
export default class AuthService extends moleculer.Service {
  @Action({
    cache: {
      keys: ['#user.id'],
    },
  })
  async me(ctx: Context<{}, UserAuthMeta>) {
    return ctx.meta.user;
  }
}
