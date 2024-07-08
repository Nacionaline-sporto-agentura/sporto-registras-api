'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  FieldHookCallback,
  RestrictionType,
  throwUnauthorizedError,
} from '../types';

import DbConnection from '../mixins/database.mixin';
import { SN_AUTH, SN_TENANTUSERS, SN_USERS } from '../types/serviceNames';
import { AuthUserRole, UserAuthMeta } from './api.service';
import { Tenant } from './tenants/index.service';
import { TenantUserRole } from './tenantUsers.service';

export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export enum UserAuthStrategy {
  PASSWORD = 'PASSWORD',
  EVARTAI = 'EVARTAI',
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  position?: string;
  type: UserType;
  authUser: number;
  authStrategy: string;
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
  name: SN_USERS,
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
          await ctx.call(`${SN_AUTH}.users.remove`, { id: entity.authUserId }, { meta: ctx?.meta });
        },
        populate: async (ctx: Context, values: number[]) => {
          return Promise.all(
            values.map((value) => {
              try {
                return ctx.call(`${SN_AUTH}.users.get`, {
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
      position: 'string|optional',
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
      authStrategy: {
        type: 'string',
        enum: Object.values(UserAuthStrategy),
        default: UserAuthStrategy.PASSWORD,
      },
      profiles: {
        virtual: true,
        type: 'array',
        items: 'object',
        populate(_ctx: Context, _values: any, users: any[]) {
          return Promise.all(
            users.map(async (user: any) => {
              return this.broker.call(`${SN_TENANTUSERS}.getProfiles`, {}, { meta: { user } });
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
              return ctx.call(`${SN_TENANTUSERS}.getRole`, {
                tenant: ctx.meta.profile.id,
                user: user.id,
              });
            }),
          );
        },
      },
      groups: {
        virtual: true,
        type: 'array',
        populate: {
          keyField: 'authUser',
          handler: async (ctx: Context<null, UserAuthMeta>, values: number[]) => {
            if (ctx?.meta?.user?.type !== UserType.ADMIN) {
              return [];
            }

            return Promise.all(
              values.map(async (value) => {
                try {
                  const authUser: any = await ctx.call(`${SN_AUTH}.users.get`, {
                    id: value,
                    populate: 'groups',
                  });
                  return authUser?.groups || [];
                } catch (e) {
                  return value;
                }
              }),
            );
          },
        },
      },
      ...COMMON_FIELDS,
    },
    scopes: {
      ...COMMON_SCOPES,
      async admins(query: any, ctx: Context<null, UserAuthMeta>, _params: any) {
        query.type = UserType.ADMIN;

        const authUserIds = query?.authUser ? [query.authUser] : [];
        if (ctx?.meta?.authUser?.type !== AuthUserRole.SUPER_ADMIN) {
          const authUsers: any = await ctx.call(`${SN_AUTH}.users.list`, {
            query: {
              type: { $in: [AuthUserRole.ADMIN, AuthUserRole.SUPER_ADMIN] },
            },
            pageSize: 10000,
          });

          authUserIds.push({ $in: authUsers?.rows?.map((u: any) => u.id) || [] });
        }

        if (query.group) {
          const authGroup: any = await ctx.call(`${SN_AUTH}.groups.get`, {
            id: query.group,
            populate: 'users',
          });

          authUserIds.push({ $in: authGroup?.users?.map((u: any) => u.id) || [] });
          delete query.group;
        }

        if (authUserIds?.length) {
          query.authUser = { $and: authUserIds };
        }

        return query;
      },
      notAdmins(query: any, _ctx: Context<null, UserAuthMeta>, _params: any) {
        query.type = UserType.USER;

        return query;
      },
      async tenant(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        let tenantId: any;

        if (ctx?.meta?.profile?.id) {
          tenantId = ctx.meta.profile.id;
          if (query.tenant) {
            const tenants: Tenant[] = await ctx.call('tenants.find', {
              query: {
                id: query.tenant,
              },
              scope: '-noParent',
            });

            tenantId = { $in: tenants.map((t) => t.id) };

            delete query.tenant;
          }
        } else if (ctx?.meta?.user?.type === UserType.ADMIN) {
          tenantId = query.tenant;
          delete query.tenant;
        } else if (!!ctx?.meta?.user?.id) {
          query.id = ctx.meta.user.id;
        }

        if (tenantId) {
          const userIds: number[] = await ctx.call(`${SN_TENANTUSERS}.findIdsByTenant`, {
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
export default class extends moleculer.Service {
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
      throwErrors: {
        type: 'boolean',
        optional: true,
        default: true,
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
        throwErrors: boolean;
      },
      UserAuthMeta
    >,
  ) {
    const { personalCode, role, throwErrors } = ctx.params;
    const { profile } = ctx.meta;
    let authGroupId: number;
    let { tenantId } = ctx.params;

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
        throwErrors,
      };

      if (data.personalCode) {
        inviteData.personalCode = data.personalCode;
        inviteData.notify = [data.email];
        if (authGroupId) {
          inviteData.companyId = authGroupId;
          inviteData.role = data.role || TenantUserRole.USER;
        }
      } else {
        inviteData.firstName = data.firstName;
        inviteData.lastName = data.lastName;
        inviteData.email = data.email;
        inviteData.phone = data.phone;
        if (authGroupId) {
          inviteData.unassignExistingGroups = false;
          inviteData.groups = [{ id: authGroupId, role: data.role || TenantUserRole.USER }];
        }
      }

      return inviteData;
    }

    let authUser: any;

    if (profile?.id && !tenantId) {
      tenantId = profile.id;
      authGroupId = profile.authGroup;
    }

    if (tenantId) {
      const tenant: Tenant = await ctx.call('tenants.resolve', {
        id: tenantId,
        throwIfNotExist: true,
      });

      authGroupId = tenant.authGroup;
    }

    const userWithPassword = !personalCode;
    const inviteData = getInviteData(ctx.params);

    if (!userWithPassword) {
      authUser = await ctx.call(`${SN_AUTH}.users.invite`, inviteData);
    } else {
      authUser = await ctx.call(`${SN_AUTH}.users.create`, inviteData);
    }

    const user: User = await ctx.call(`${SN_USERS}.findOrCreate`, {
      authUser,
      firstName: ctx.params.firstName,
      lastName: ctx.params.lastName,
      email: ctx.params.email,
      phone: ctx.params.phone,
      authStrategy: userWithPassword ? UserAuthStrategy.PASSWORD : UserAuthStrategy.EVARTAI,
    });

    if (authGroupId && !userWithPassword) {
      const authGroup: any = await ctx.call(`${SN_AUTH}.groups.get`, {
        id: authGroupId,
      });
      if (authGroup && authGroup.id) {
        await ctx.call(`${SN_TENANTUSERS}.createRelationshipsIfNeeded`, {
          authGroup: { ...authGroup, role },
          userId: user.id,
        });
      }
    } else if (tenantId) {
      await ctx.call(`${SN_TENANTUSERS}.addUser`, {
        userId: user.id,
        tenantId,
        role,
      });
    }

    if (authUser?.url) {
      return { ...user, url: authUser.url };
    }

    return user;
  }

  @Action({
    rest: 'POST /:id/impersonate',
    params: {
      id: 'number|convert',
    },
    auth: RestrictionType.ADMIN,
  })
  async impersonate(ctx: Context<{ id: number }, UserAuthMeta>) {
    const { id } = ctx.params;

    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id });

    return ctx.call(`${SN_AUTH}.users.impersonate`, { id: user.authUser });
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
    const user: User = await ctx.call(`${SN_USERS}.findOrCreate`, {
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
      firstName: 'string|optional',
      lastName: 'string|optional',
      position: 'string|optional',
      email: 'string|optional',
      phone: 'string|optional',
      type: 'string|optional',
      authStrategy: 'string|optional',
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
      position?: string;
      authStrategy?: string;
    }>,
  ) {
    const { authUser, update, firstName, lastName, email, phone, type, authStrategy, position } =
      ctx.params;
    if (!authUser || !authUser.id) return;

    const scope = COMMON_DEFAULT_SCOPES;

    const authUserIsAdmin = [AuthUserRole.SUPER_ADMIN, AuthUserRole.ADMIN].includes(authUser.type);

    if (authUserIsAdmin) {
      scope.push(...USERS_WITHOUT_NOT_ADMINS_SCOPE);
    }

    const user: User = await ctx.call(`${SN_USERS}.findOne`, {
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
      position,
      authStrategy: authStrategy || UserAuthStrategy.PASSWORD,
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
      id: 'number|convert',
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
    const user: User = await ctx.call(`${SN_USERS}.resolve`, { id, scope, throwIfNotExist: true });

    if (profile?.id) {
      return ctx.call(`${SN_TENANTUSERS}.removeUser`, {
        userId: id,
        tenantId: profile.id,
      });
    } else if (ctx.meta.user.type === UserType.ADMIN && user.type == UserType.USER) {
      await ctx.call(`${SN_TENANTUSERS}.removeTenants`, {
        userId: id,
      });
    }

    return this.removeEntity(ctx, { id }, { scope });
  }

  @Action({
    rest: 'PATCH /me',
    params: {
      email: 'string|optional',
      phone: 'string|optional',
      firstName: 'string|optional',
      lastName: 'string|optional',
      password: 'string|optional',
      oldPassword: 'string|optional',
    },
    auth: [RestrictionType.USER, RestrictionType.ADMIN],
  })
  async updateMe(
    ctx: Context<
      {
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        password?: string;
        oldPassword?: string;
      },
      UserAuthMeta
    >,
  ) {
    const { email, phone, firstName, lastName } = ctx.params;

    if (ctx.meta.user.authStrategy === UserAuthStrategy.PASSWORD) {
      await ctx.call(`${SN_AUTH}.users.update`, {
        id: ctx.meta.user.authUser,
        email,
        firstName,
        lastName,
        password: ctx.params.password,
        oldPassword: ctx.params.oldPassword,
        phone,
      });
    }

    return ctx.call(`${SN_USERS}.update`, {
      id: ctx.meta.user.id,
      firstName,
      lastName,
      email,
      phone,
    });
  }

  @Action({
    rest: 'PATCH /:id',
    params: {
      id: 'number|convert',
      role: 'string|optional',
      email: 'string|optional',
      phone: 'string|optional',
      firstName: 'string|optional',
      lastName: 'string|optional',
      password: 'string|optional',
      oldPassword: 'string|optional',
      tenantId: 'number|optional|convert',
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_ADMIN],
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
        password: string;
        oldPassword: string;
      },
      UserAuthMeta
    >,
  ) {
    const { profile } = ctx.meta;
    const { id, email, phone, role, tenantId, firstName, lastName } = ctx.params;

    const userToUpdate: User = await ctx.call(`${SN_USERS}.resolve`, { id, throwIfNotExist: true });

    if (userToUpdate.authStrategy === UserAuthStrategy.PASSWORD) {
      await ctx.call(`${SN_AUTH}.users.update`, {
        id: userToUpdate.authUser,
        email,
        firstName,
        lastName,
        password: ctx.params.password,
        oldPassword: ctx.params.oldPassword,
        phone,
      });
    }

    if (role) {
      await ctx.call(`${SN_TENANTUSERS}.updateUser`, {
        userId: id,
        tenantId: profile?.id || tenantId,
        role,
      });
    }

    return ctx.call(`${SN_USERS}.update`, {
      id,
      firstName,
      lastName,
      email,
      phone,
    });
  }

  @Action()
  async seedAuthData() {
    const data: Array<any> = await this.broker.call(`${SN_AUTH}.getSeedData`, {
      timeout: 120 * 1000,
    });

    for (const authUser of data) {
      await this.broker.call(`${SN_AUTH}.createUserWithTenantsIfNeeded`, {
        authUser,
        authUserGroups: authUser?.groups,
      });
    }
  }

  @Event()
  async [`${SN_USERS}.**`]() {
    this.broker.emit('cache.clean.auth');
    this.broker.emit(`cache.clean.${this.fullName}`);
  }

  @Event()
  async 'cache.clean.users'() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }
}
