'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
import { RestrictionType } from '../types';
import { AuthUserRole } from './api.service';
import { USERS_ADMINS_SCOPE, User } from './users.service';

const scope = USERS_ADMINS_SCOPE;

const GroupRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

@Service({
  name: 'admins',
})
export default class AdminService extends moleculer.Service {
  @Action()
  find(ctx: Context<{}>) {
    return ctx.call('users.find', {
      ...(ctx.params || {}),
      scope,
    });
  }

  @Action({
    rest: 'GET /',
    auth: RestrictionType.ADMIN,
  })
  list(ctx: Context<{}>) {
    return ctx.call('users.list', {
      ...(ctx.params || {}),
      scope,
    });
  }

  @Action({
    rest: 'GET /:id',
    auth: RestrictionType.ADMIN,
  })
  get(ctx: Context<{}>) {
    return ctx.call('users.get', {
      ...(ctx.params || {}),
      scope,
    });
  }

  @Action({
    rest: 'POST /',
    auth: RestrictionType.ADMIN,
    params: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      phone: 'string|optional',
      groups: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: 'number|convert',
            role: {
              type: 'enum',
              values: Object.values(GroupRole),
              default: GroupRole.USER,
            },
          },
        },
        default: () => [{ id: Number(process.env.NSA_GROUP_ID), role: GroupRole.ADMIN }],
      },
    },
  })
  async create(
    ctx: Context<{
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      groups: Array<{
        id: number;
        role: string;
      }>;
    }>,
  ) {
    const { email, phone, firstName, lastName, groups } = ctx.params;
    const authUser: any = await ctx.call('auth.users.create', {
      email,
      firstName,
      lastName,
      phone,
      groups,
      type: AuthUserRole.ADMIN,
    });

    const user: User = await ctx.call('users.findOrCreate', {
      authUser,
      firstName,
      lastName,
      email,
      phone,
      update: true,
    });

    if (authUser?.url) {
      return { ...user, url: authUser.url };
    }

    return user;
  }

  @Action({
    rest: 'PATCH /:id',
    auth: RestrictionType.ADMIN,
  })
  async update(
    ctx: Context<{
      id: number;
      email: string;
      password: string;
      oldPassword: string;
      firstName: string;
      lastName: string;
      phone: string;
      groups: Array<{
        id: number;
        role: string;
      }>;
    }>,
  ) {
    const { id, email, password, oldPassword, firstName, lastName, phone, groups } = ctx.params;

    const user: User = await ctx.call('users.resolve', { id, throwIfNotExist: true });

    const authUser = await ctx.call('auth.users.update', {
      id: user.authUser,
      email,
      firstName,
      lastName,
      password,
      oldPassword,
      phone,
      groups,
    });

    return ctx.call('users.findOrCreate', {
      authUser,
      firstName,
      lastName,
      email,
      phone,
      update: true,
    });
  }

  @Action({
    rest: 'DELETE /:id',
    auth: RestrictionType.ADMIN,
  })
  async remove(
    ctx: Context<{
      id: number;
    }>,
  ) {
    const { id } = ctx.params;

    return ctx.call('users.removeUser', {
      id,
      scope,
    });
  }
}
