'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  FieldHookCallback,
  RestrictionType,
  throwNotFoundError,
  throwUnauthorizedError,
} from '../types';

import DbConnection from '../mixins/database.mixin';
import { AuthUserRole, UserAuthMeta } from './api.service';
import { TenantUserRole } from './tenantUsers.service';
import { Tenant } from './tenants.service';

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
  authUser: number;
}

const VISIBLE_TO_USER_SCOPE = 'tenant';
const NOT_ADMINS_SCOPE = 'notAdmins';
const ADMINS_SCOPE = 'admins';

const AUTH_PROTECTED_SCOPES = [...COMMON_DEFAULT_SCOPES, VISIBLE_TO_USER_SCOPE, NOT_ADMINS_SCOPE];

export const USERS_WITHOUT_AUTH_SCOPES = [`-${VISIBLE_TO_USER_SCOPE}`];
const USERS_WITHOUT_NOT_ADMINS_SCOPE = [`-${NOT_ADMINS_SCOPE}`];
export const USERS_ADMINS_SCOPE = [`-${NOT_ADMINS_SCOPE}`, ADMINS_SCOPE];
export const USERS_DEFAULT_SCOPES = [
  ...USERS_WITHOUT_AUTH_SCOPES,
  ...USERS_WITHOUT_NOT_ADMINS_SCOPE,
];

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
        async onRemove({ ctx, entity }: FieldHookCallback) {
          await ctx.call('auth.users.remove', { id: entity.authUserId }, { meta: ctx?.meta });
        },
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

      profiles: {
        virtual: true,
        type: 'array',
        items: 'object',
        populate(_ctx: Context, _values: any, users: any[]) {
          return Promise.all(
            users.map(async (user: any) => {
              return this.broker.call(
                'tenantUsers.getProfiles',
                {},
                {
                  meta: {
                    user,
                  },
                },
              );
            }),
          );
        },
      },

      role: {
        virtual: true,
        type: 'string',
        populate(ctx: any, _values: any, users: any[]) {
          return Promise.all(
            users.map(async (user: any) => {
              if (!ctx.meta.profile?.id) return;
              return ctx.call('tenantUsers.getRole', {
                tenant: ctx.meta.profile.id,
                user: user.id,
              });
            }),
          );
        },
      },

      ...COMMON_FIELDS,
    },
    scopes: {
      ...COMMON_SCOPES,
      admins(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        query.type = UserType.ADMIN;
        return query;
      },
      notAdmins(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        query.type = UserType.USER;

        return query;
      },
      async tenant(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        let tenantId: number;

        if (ctx?.meta?.profile?.id) {
          tenantId = ctx.meta.profile.id;
        } else if (ctx?.meta?.user?.type === UserType.ADMIN) {
          tenantId = query.tenant;
          delete query.tenant;
        } else if (!!ctx?.meta?.user?.id) {
          query.id = ctx.meta.user.id;
        }

        if (tenantId) {
          const userIds: number[] = await ctx.call('tenantUsers.findIdsByTenant', {
            id: tenantId,
            role: query.role,
          });
          delete query.role;

          if (params?.id) {
            let hasPermissions = false;
            if (Array.isArray(params.id)) {
              hasPermissions = params.id.every((id: number) => userIds.includes(Number(id)));
            } else {
              hasPermissions = userIds.includes(Number(params.id));
            }

            if (!hasPermissions) {
              throwUnauthorizedError(`Cannot access user with ID: ${params.id}`);
            }
          } else {
            query.id = { $in: userIds };
          }
        }
        return query;
      },
    },
    defaultScopes: AUTH_PROTECTED_SCOPES,
  },
  actions: {
    get: {
      auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
    },

    list: {
      auth: [RestrictionType.ADMIN, RestrictionType.TENANT_USER],
    },

    remove: {
      rest: null,
    },

    update: {
      rest: null,
    },

    create: {
      rest: null,
    },
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
    params: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      personalCode: 'string|optional',
      phone: 'string|optional',
      tenantId: 'number|optional|convert',
      role: {
        type: 'string',
        optional: true,
        default: TenantUserRole.USER,
      },
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
  })
  async invite(
    ctx: Context<
      {
        firstName: string;
        lastName: string;
        email: string;
        personalCode?: string;
        phone?: string;
        role?: TenantUserRole;
        tenantId?: number;
      },
      UserAuthMeta
    >,
  ) {
    const { personalCode, role, tenantId } = ctx.params;
    const { profile, user: authenticatedUser } = ctx.meta;

    function getInviteData(data: {
      firstName: string;
      lastName: string;
      email: string;
      personalCode?: string;
      phone?: string;
      role?: TenantUserRole;
      tenantId?: number;
    }) {
      const inviteData: any = {
        apps: [ctx.meta?.app?.id],
      };

      if (data.personalCode) {
        inviteData.personalCode = data.personalCode;
        inviteData.notify = [data.email];
        if (data?.tenantId) {
          inviteData.companyId = data.tenantId;
          inviteData.role = data.role || TenantUserRole.USER;
        } else {
        }
      } else {
        inviteData.firstName = data.firstName;
        inviteData.lastName = data.lastName;
        inviteData.email = data.email;
        inviteData.phone = data.phone;
      }

      return inviteData;
    }

    let authUser: any;

    let authGroupId;
    if (profile?.id) {
      ctx.params.tenantId = profile.authGroup;
      authGroupId = profile.authGroup;
    }

    let tenant: Tenant;
    if (tenantId) {
      tenant = await ctx.call('tenants.resolve', {
        id: tenantId,
      });

      if (authenticatedUser?.type !== UserType.ADMIN || !tenant?.id) {
        throw new moleculer.Errors.MoleculerClientError(
          'Cannot assign user to tenant.',
          401,
          'UNAUTHORIZED',
        );
      }

      ctx.params.tenantId = tenant.authGroup;
      authGroupId = tenant.authGroup;
    }

    const userWithPassword = !personalCode;
    const inviteData = getInviteData(ctx.params);

    console.log(inviteData);
    if (!userWithPassword) {
      authUser = await ctx.call('auth.users.invite', inviteData);
    } else {
      authUser = await ctx.call('auth.users.create', inviteData);
    }

    const user: User = await ctx.call('users.findOrCreate', {
      authUser,
      firstName: ctx.params.firstName,
      lastName: ctx.params.lastName,
      email: ctx.params.email,
      phone: ctx.params.phone,
    });

    if (authGroupId && !userWithPassword) {
      const authGroup: any = await ctx.call('auth.groups.get', {
        id: authGroupId,
      });
      if (authGroup && authGroup.id) {
        await ctx.call('tenantUsers.createRelationshipsIfNeeded', {
          authGroup: { ...authGroup, role },
          userId: user.id,
        });
      }
    } else if (tenantId) {
      await ctx.call('tenantUsers.addUser', {
        userId: user.id,
        tenantId,
        role,
      });
    }

    return user;
  }

  @Action({
    rest: 'POST /:id/impersonate',
    params: {
      id: {
        type: 'number',
        convert: true,
      },
    },
  })
  async impersonate(ctx: Context<{ id: number }, UserAuthMeta>) {
    const { id } = ctx.params;

    const user: User = await ctx.call('users.resolve', { id });

    return ctx.call('auth.users.impersonate', { id: user.authUser });
  }

  @Action({
    params: {
      authUser: 'any',
    },
    cache: {
      keys: ['authUser.id'],
    },
  })
  async resolveByAuthUser(ctx: Context<{ authUser: any }>) {
    const user: User = await ctx.call('users.findOrCreate', {
      authUser: ctx.params.authUser,
    });

    return user;
  }

  @Action({
    params: {
      authUser: 'any',
      update: {
        type: 'boolean',
        default: false,
      },
      firstName: {
        type: 'string',
        optional: true,
      },
      lastName: {
        type: 'string',
        optional: true,
      },
      email: {
        type: 'string',
        optional: true,
      },
      phone: {
        type: 'string',
        optional: true,
      },
      type: {
        type: 'string',
        optional: true,
      },
    },
  })
  async findOrCreate(
    ctx: Context<{
      authUser: any;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      type?: string;
      update?: boolean;
    }>,
  ) {
    const { authUser, update, firstName, lastName, email, phone, type } = ctx.params;
    if (!authUser || !authUser.id) return;

    const scope = COMMON_DEFAULT_SCOPES;

    const authUserIsAdmin = [AuthUserRole.SUPER_ADMIN, AuthUserRole.ADMIN].includes(authUser.type);

    if (authUserIsAdmin) {
      scope.push(...USERS_WITHOUT_NOT_ADMINS_SCOPE);
    }

    const user: User = await ctx.call('users.findOne', {
      query: {
        authUser: authUser.id,
      },
      scope,
    });

    if (!update && user && user.id) return user;

    const dataToSave = {
      firstName: firstName || authUser.firstName,
      lastName: lastName || authUser.lastName,
      type: authUserIsAdmin ? UserType.ADMIN : UserType.USER,
      email: email || authUser.email,
      phone: phone || authUser.phone,
    };

    // let user to customize his phone and email
    if (user?.email && !authUserIsAdmin) {
      delete dataToSave.email;
    }
    if (user?.phone && !authUserIsAdmin) {
      delete dataToSave.phone;
    }

    if (user?.id) {
      return this.updateEntity(
        ctx,
        {
          id: user.id,
          ...dataToSave,
        },
        { scope },
      );
    }

    return this.createEntity(ctx, {
      authUser: authUser.id,
      type,
      ...dataToSave,
    });
  }

  @Action({
    rest: 'DELETE /:id',
    params: {
      id: {
        type: 'number',
        convert: true,
      },
      scope: [
        { type: 'string', optional: true },
        { type: 'array', items: 'string', optional: true },
      ],
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
  })
  async removeUser(ctx: Context<{ id: number; scope: string | string[] }, UserAuthMeta>) {
    const { id, scope } = ctx.params;
    const { profile } = ctx.meta;
    const user: User = await ctx.call('users.resolve', { id, scope, throwIfNotExist: true });

    if (profile?.id) {
      return ctx.call('tenantUsers.removeUser', {
        userId: id,
        tenantId: profile.id,
      });
    } else if (ctx.meta.user.type === UserType.ADMIN && user.type == UserType.USER) {
      await ctx.call('tenantUsers.removeTenants', {
        userId: id,
      });
    }

    return this.removeEntity(ctx, { id }, { scope });
  }

  @Action({
    rest: 'PATCH /:id',
    params: {
      id: 'any',
      role: {
        type: 'string',
        optional: true,
      },
      email: {
        type: 'string',
        optional: true,
      },
      phone: {
        type: 'string',
        optional: true,
      },
      firstName: {
        type: 'string',
        optional: true,
      },
      lastName: {
        type: 'string',
        optional: true,
      },
      tenantId: {
        type: 'number',
        optional: true,
      },
    },
  })
  async updateUser(
    ctx: Context<
      {
        id: number;
        role: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        tenantId: number;
      },
      UserAuthMeta
    >,
  ) {
    const { profile } = ctx.meta;
    const { id, email, phone, role, tenantId, firstName, lastName } = ctx.params;

    const userToUpdate: User = await ctx.call('users.resolve', { id });

    if (!userToUpdate) {
      return throwNotFoundError('User not found.');
    }

    if (role) {
      await ctx.call('tenantUsers.updateUser', {
        userId: id,
        tenantId: profile?.id || tenantId,
        role,
      });
    }

    return ctx.call('users.update', {
      id,
      firstName,
      lastName,
      email,
      phone,
    });
  }

  @Method
  async seedDB() {
    await this.broker.waitForServices(['auth', 'tenants', 'tenantUsers']);
    const data: Array<any> = await this.broker.call('auth.getSeedData', {
      timeout: 120 * 1000,
    });

    for (const authUser of data) {
      await this.broker.call('auth.createUserWithTenantsIfNeeded', {
        authUser,
        authUserGroups: authUser?.groups,
      });
    }
  }

  @Event()
  async 'users.**'() {
    this.broker.emit('cache.clean.auth');
    this.broker.emit(`cache.clean.${this.fullName}`);
  }

  @Event()
  async 'cache.clean.users'() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }
}
