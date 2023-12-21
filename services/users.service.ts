'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import { COMMON_DEFAULT_SCOPES, COMMON_FIELDS, COMMON_SCOPES, FieldHookCallback } from '../types';

import DbConnection from '../mixins/database.mixin';
import { AuthUserRole, UserAuthMeta } from './api.service';

export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  type: UserType;
}

@Service({
  name: 'users',
  mixins: [
    DbConnection({
      collection: 'users',
      entityChangedOldEntity: true,
      createActions: {
        createMany: false,
      },
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

      authUser: {
        type: 'number',
        columnType: 'integer',
        columnName: 'authUserId',
        required: true,
        populate: async (ctx: Context, values: number[]) => {
          return Promise.all(
            values.map((value) => {
              try {
                return ctx.call('auth.users.get', {
                  id: value,
                  scope: false,
                });
              } catch (e) {
                return value;
              }
            }),
          );
        },
      },

      firstName: 'string',
      lastName: 'string',
      phone: 'string',

      email: {
        type: 'email',
        set: ({ value }: FieldHookCallback) => value?.toLowerCase().trim(),
      },

      fullName: {
        type: 'string',
        readonly: true,
      },

      type: {
        type: 'string',
        enum: Object.values(UserType),
        default: UserType.USER,
      },

      ...COMMON_FIELDS,
    },
    scopes: {
      ...COMMON_SCOPES,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
})
export default class UsersService extends moleculer.Service {
  @Method
  typeToAuthRole(type: UserType): AuthUserRole {
    // at this moment it's 1:1 types, but it's not the same
    switch (type) {
      case UserType.USER:
        return AuthUserRole.USER;

      case UserType.ADMIN:
      default:
        return AuthUserRole.ADMIN;
    }
  }

  @Method
  authRoleToType(type: AuthUserRole): UserType {
    switch (type) {
      case AuthUserRole.ADMIN:
      case AuthUserRole.SUPER_ADMIN:
        return UserType.ADMIN;

      case AuthUserRole.USER:
      default:
        return UserType.USER;
    }
  }

  @Action({
    rest: 'POST /',
    name: 'create',
    params: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      personalCode: 'string|optional',
      phone: 'string|optional',
      type: {
        type: 'enum',
        values: Object.values(UserType),
        default: UserType.USER,
      },
    },
  })
  async createAction(
    ctx: Context<
      {
        firstName: string;
        lastName: string;
        email: string;
        personalCode?: string;
        phone?: string;
        type: UserType;
      },
      UserAuthMeta
    >,
  ) {
    const { email, phone, personalCode, firstName, lastName, type } = ctx.params;

    let authUser: any;

    if (type === UserType.USER) {
      if (personalCode) {
        authUser = await ctx.call('auth.users.invite', {
          personalCode,
          notify: [email],
        });
      } else {
        authUser = await ctx.call('auth.users.create', {
          email,
          firstName,
          lastName,
          phone,
          apps: [ctx.meta.app.id],
        });
      }
    } else {
      authUser = await ctx.call('auth.users.create', {
        email,
        firstName,
        lastName,
        phone,
        groups: [{ id: Number(process.env.NSA_GROUP_ID), role: AuthUserRole.ADMIN }],
      });
    }

    const user: User = await this.findEntity(ctx, {
      query: {
        authUser: authUser.id,
      },
    });

    const userData = {
      authUser: authUser.id,
      firstName: authUser.firstName || firstName,
      lastName: authUser.lastName || lastName,
      email: authUser.email || email,
      phone: authUser.phone || phone,
      type,
    };

    if (user) {
      return this.updateEntity(ctx, {
        id: user.id,
        ...userData,
      });
    }

    return this.createEntity(ctx, userData);
  }

  @Method
  async seedDB() {
    await this.broker.waitForServices(['auth']);
    const data: Array<any> = await this.broker.call('auth.getSeedData', {
      timeout: 120 * 1000,
    });

    for (const authUser of data) {
      await this.createEntity(null, {
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        type: this.authRoleToRole(authUser.role),
        email: authUser.email?.trim?.(),
        phone: authUser.phone,
        authUser: authUser.id,
      });
    }
  }
}
