'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
import { RestrictionType } from '../types';
import { SN_ADMINS, SN_AUTH, SN_USERS } from '../types/serviceNames';
import { AuthUserRole } from './api.service';
import { USERS_ADMINS_SCOPE, User } from './users.service';

const scope = USERS_ADMINS_SCOPE;

const GroupRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

@Service({
  name: SN_ADMINS,
})
export default class extends moleculer.Service {
  @Action()
  find(ctx: Context<{}>) {
    return ctx.call(`${SN_USERS}.find`, {
      ...(ctx.params || {}),
      scope,
    });
  }

  @Action({
    rest: 'GET /',
    auth: RestrictionType.ADMIN,
  })
  list(ctx: Context<{}>) {
    return ctx.call(`${SN_USERS}.list`, {
      ...(ctx.params || {}),
      scope,
    });
  }

  @Action({
    rest: 'GET /:id',
    params: {
      id: 'number|convert',
    },
    auth: RestrictionType.ADMIN,
  })
  get(ctx: Context<{}>) {
    return ctx.call(`${SN_USERS}.get`, {
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
      position: 'string|optional',
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
      position: string;
      phone: string;
      email: string;
      groups: Array<{
        id: number;
        role: string;
      }>;
    }>,
  ) {
    const { email, phone, firstName, lastName, groups, position } = ctx.params;
    const authUser: any = await ctx.call(`${SN_AUTH}.users.create`, {
      email,
      firstName,
      lastName,
      phone,
      groups,
      type: AuthUserRole.ADMIN,
    });

    const user: User = await ctx.call(`${SN_USERS}.findOrCreate`, {
      authUser,
      firstName,
      lastName,
      email,
      phone,
      position,
      update: true,
    });

    if (authUser?.url) {
      return { ...user, url: authUser.url };
    }

    return user;
  }

  @Action({
    rest: 'PATCH /:id',
    params: {
      id: 'number|convert',
    },
    auth: RestrictionType.ADMIN,
  })
  async update(
    ctx: Context<{
      id: number;
      email: string;
      password: string;
      position: string;
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
    const { id, email, password, oldPassword, firstName, lastName, phone, groups, position } =
      ctx.params;

    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id, throwIfNotExist: true, scope });

    const authUser = await ctx.call(`${SN_AUTH}.users.update`, {
      id: user.authUser,
      email,
      firstName,
      lastName,
      password,
      oldPassword,
      phone,
      groups,
    });

    return ctx.call(`${SN_USERS}.findOrCreate`, {
      authUser,
      firstName,
      lastName,
      position,
      email,
      phone,
      update: true,
    });
  }

  @Action({
    rest: 'DELETE /:id',
    params: {
      id: 'number|convert',
    },
    auth: RestrictionType.ADMIN,
  })
  async remove(
    ctx: Context<{
      id: number;
    }>,
  ) {
    const { id } = ctx.params;

    return ctx.call(`${SN_USERS}.removeUser`, {
      id,
      scope,
    });
  }
}
