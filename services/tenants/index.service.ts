'use strict';

import moleculer, { Context, RestSchema } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';

import _ from 'lodash';
import filtersMixin from 'moleculer-knex-filters';
import DbConnection, { PopulateHandlerFn } from '../../mixins/database.mixin';
import RequestMixin, { REQUEST_FIELDS } from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  RestrictionType,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
  throwNotFoundError,
  throwUnauthorizedError,
} from '../../types';
import {
  SN_AUTH,
  SN_REQUESTS,
  SN_SPORTSBASES,
  SN_TENANTS,
  SN_TENANTS_FUNDINGSOURCES,
  SN_TENANTS_GOVERNINGBODIES,
  SN_TENANTS_LEGALFORMS,
  SN_TENANTS_MEMBERSHIPS,
  SN_TENANTS_SPORTORGANIZATIONTYPES,
  SN_TENANTUSERS,
  SN_USERS,
} from '../../types/serviceNames';
import {
  getFormattedDate,
  getFormattedYear,
  getSportsBaseUniqueSportTypes,
  handleFormatResponse,
} from '../../utils';
import { UserAuthMeta } from '../api.service';
import { Request, RequestEntityTypes, RequestStatus } from '../requests/index.service';
import { SportsBase } from '../sportsBases/index.service';
import { TenantUser, TenantUserRole } from '../tenantUsers.service';
import { SportType } from '../types/sportTypes/index.service';
import { TenantSportOrganizationTypes } from '../types/tenants/sportOrganizationTypes.service';
import { User, UserType } from '../users.service';
import { TenantFundingSource } from './fundingSources.service';
import { TenantGoverningBody } from './governingBodies.service';
import { TenantMembership } from './memberships.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: undefined;
  authGroup: number;
  parent: number;
  fundingSources: undefined;
  governingBodies: undefined;
  memberships: undefined;
  address: string;
  sportsBases: undefined;
  type: undefined;
  children: undefined;
  data: {
    url: string;
    foundedAt: Date;
    hasBeneficiaryStatus: boolean;
    nonGovernmentalOrganization: boolean;
    nonFormalEducation: boolean;
    canHaveChildren: boolean;
  };
}

interface Populates extends CommonPopulates {
  role: TenantUserRole;
  authGroup: any;
  children: Tenant[];
  parent: Tenant;
  type: TenantSportOrganizationTypes;
  fundingSources: Array<TenantFundingSource<'type'>>;
  governingBodies: TenantGoverningBody[];
  memberships: TenantMembership[];
  sportsBases: SportsBase<'spaces'>[];
}

export type Tenant<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export enum TenantTenantType {
  MUNICIPALITY = 'MUNICIPALITY',
  ORGANIZATION = 'ORGANIZATION',
}

@Service({
  name: SN_TENANTS,

  mixins: [
    DbConnection({
      collection: 'tenants',
    }),
    RequestMixin,
    filtersMixin(),
  ],

  settings: {
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },

      name: 'string',
      email: 'string',
      phone: 'string',
      code: 'string',
      address: 'string',

      authGroup: {
        type: 'number',
        columnType: 'integer',
        columnName: 'authGroupId',
        populate: `${SN_AUTH}.groups.get`,
        async onRemove({ ctx, entity }: FieldHookCallback) {
          await ctx.call(
            `${SN_AUTH}.groups.remove`,
            { id: entity.authGroupId },
            { meta: ctx?.meta },
          );
        },
      },

      tenantType: {
        type: 'string',
        enum: Object.values(TenantTenantType),
        default: TenantTenantType.ORGANIZATION,
      },

      legalForm: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'legalFormId',
        populate: {
          action: `${SN_TENANTS_LEGALFORMS}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },
      type: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportOrganizationTypeId',
        populate: {
          action: `${SN_TENANTS_SPORTORGANIZATIONTYPES}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },

      data: {
        type: 'object',
        properties: {
          url: 'string',
          foundedAt: 'date',
          hasBeneficiaryStatus: 'boolean',
          nonGovernmentalOrganization: 'boolean',
          nonFormalEducation: 'boolean',
          canHaveChildren: 'boolean',
        },
      },

      role: {
        virtual: true,
        type: TenantUserRole,
        populate(ctx: any, _values: any, tenants: any[]) {
          return Promise.all(
            tenants.map(async (tenant: any) => {
              if (!ctx.meta.user?.id) return;
              const tenantUser: TenantUser = await ctx.call(`${SN_TENANTUSERS}.findOne`, {
                query: {
                  tenant: tenant.id,
                  user: ctx.meta.user.id,
                },
              });
              return tenantUser?.role;
            }),
          );
        },
      },

      parent: {
        type: 'number',
        columnType: 'integer',
        columnName: 'parentId',
        populate: 'tenants.resolve',
      },

      children: {
        virtual: true,
        type: 'array',
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('tenants.populateByProp'),
          inheritPopulate: true,
          params: {
            sort: 'name',
            mappingMulti: true,
            queryKey: 'parent',
            populate: 'children',
          },
        },
      },

      fundingSources: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn(`${SN_TENANTS_FUNDINGSOURCES}.populateByProp`),
          params: {
            queryKey: 'tenant',
            mappingMulti: true,
            populate: ['type'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_TENANTS_FUNDINGSOURCES,
          relationField: 'tenant',
        },
      },

      governingBodies: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn(`${SN_TENANTS_GOVERNINGBODIES}.populateByProp`),
          params: {
            queryKey: 'tenant',
            mappingMulti: true,
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_TENANTS_GOVERNINGBODIES,
          relationField: 'tenant',
        },
      },

      memberships: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn(`${SN_TENANTS_MEMBERSHIPS}.populateByProp`),
          params: {
            queryKey: 'tenant',
            mappingMulti: true,
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_TENANTS_MEMBERSHIPS,
          relationField: 'tenant',
        },
      },

      sportsBases: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn(`${SN_SPORTSBASES}.populateByProp`),
          params: {
            queryKey: 'tenant',
            mappingMulti: true,
            sort: 'name',
            populate: ['spaces'],
            fields: ['id', 'name', 'spaces', 'tenant', 'address'],
          },
        },
      },

      ...REQUEST_FIELDS(RequestEntityTypes.TENANTS),
      ...COMMON_FIELDS,
    },

    scopes: {
      ...COMMON_SCOPES,
      noParent(query: any, _ctx: Context<null, UserAuthMeta>, params: any) {
        // TODO: apply for visible subtenants for users
        if (!params?.id && !query?.parent) {
          query.parent = { $exists: false };
        }
        return query;
      },
      async user(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
        if (ctx?.meta?.user?.type === UserType.USER) {
          const tenantsIds: number[] = await ctx.call(`${SN_TENANTUSERS}.findIdsByUserRecursive`, {
            id: ctx.meta.user.id,
          });

          if (params?.id) {
            let hasPermissions = false;
            if (Array.isArray(params.id)) {
              hasPermissions = params.id.every((id: number) => tenantsIds.includes(Number(id)));
            } else {
              hasPermissions = tenantsIds.includes(Number(params.id));
            }
            if (!hasPermissions) {
              throwUnauthorizedError(`Cannot access this tenant with ID: ${params.id}`);
            }
          } else {
            if (query.id) {
              query.id = { $and: [{ id: query.id }, { id: { $in: tenantsIds } }] };
            } else {
              query.id = { $in: tenantsIds };
            }
          }
        }
        return query;
      },
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES, 'user', 'noParent'],
  },

  actions: {
    create: {
      rest: null,
    },

    update: {
      auth: [RestrictionType.ADMIN, RestrictionType.TENANT_USER],
    },

    remove: {
      rest: null,
      auth: RestrictionType.ADMIN,
    },
  },
})
export default class extends moleculer.Service {
  @Action({
    rest: 'GET /:id/base',
    params: {
      id: 'number|convert',
    },
  })
  base(ctx: Context<{ id: Tenant['id'] }>) {
    return this.resolveEntities(ctx, {
      id: ctx.params.id,
      populate: [
        'lastRequest',
        'canCreateRequest',
        'fundingSources',
        'governingBodies',
        'memberships',
        'legalForm',
        'type',
      ],
    });
  }

  @Action({
    params: {
      authGroup: 'any',
      email: 'string|optional',
      phone: 'string|optional',
      name: 'string|optional',
      parent: 'number|optional|convert',
      update: {
        type: 'boolean',
        optional: true,
        default: false,
      },
    },
  })
  async findOrCreate(
    ctx: Context<{
      authGroup: any;
      update?: boolean;
      name?: string;
      phone?: string;
      email?: string;
      parent?: number;
    }>,
  ) {
    const { authGroup, update, name, phone, email } = ctx.params;
    if (!authGroup || !authGroup.id) return;

    const tenant: Tenant = await ctx.call('tenants.findOne', {
      query: {
        authGroup: authGroup.id,
      },
    });

    if (!update && tenant && tenant.id) return tenant;

    delete ctx.params.authGroup;

    const dataToSave = {
      ...ctx.params,
      name: name || authGroup.name,
      email: email || authGroup.companyEmail,
      phone: phone || authGroup.companyPhone,
      code: authGroup.companyCode,
    };

    if (tenant?.id) {
      return ctx.call('tenants.update', {
        ...dataToSave,
        id: tenant.id,
      });
    }

    return ctx.call('tenants.create', {
      ...dataToSave,
      authGroup: authGroup.id,
    });
  }

  @Action({
    rest: 'POST /',
    params: {
      code: 'string',
      name: 'string',
      email: 'string',
      phone: 'string',
      parent: 'number|optional|convert',
      user: {
        type: 'object',
        optional: true,
        properties: {
          personalCode: 'string|optional',
          firstName: 'string',
          lastName: 'string',
          email: 'string',
          phone: 'string',
        },
      },
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_USER],
  })
  async invite(
    ctx: Context<
      {
        code: string;
        name: string;
        email: string;
        phone: string;
        user?: {
          personalCode: string;
          phone: string;
          email: string;
          firstName: string;
          lastName: string;
        };
        parent?: number;
      },
      UserAuthMeta
    >,
  ) {
    const { code, email, user: owner } = ctx.params;

    const companyInviteData: any = { companyCode: code };

    if (!owner?.email) {
      companyInviteData.notify = [email];
    }

    // pre-assign parent
    if (ctx?.meta?.user?.type === UserType.USER && !ctx.params.parent) {
      ctx.params.parent = ctx.meta.profile.id;
    }

    // validate parent & assign parent company
    if (ctx.params.parent) {
      const tenant: Tenant = await ctx.call('tenants.resolve', {
        id: ctx.params.parent,
        throwIfNotExist: true,
      });
      companyInviteData.companyId = tenant.authGroup;
    }

    const authGroup: any = await ctx.call(`${SN_AUTH}.users.invite`, companyInviteData);

    const tenant: Tenant = await ctx.call('tenants.findOrCreate', { ...ctx.params, authGroup });

    let user: User & { url?: string };

    if (owner?.email) {
      user = await ctx.call(`${SN_USERS}.invite`, {
        ...owner,
        role: TenantUserRole.ADMIN,
        tenantId: tenant.id,
        throwErrors: false,
      });
    }

    if (user?.url) {
      return { ...tenant, url: user.url };
    }

    return tenant;
  }

  @Action({
    rest: 'DELETE /:id',
    params: {
      id: 'number|convert',
    },
    auth: [RestrictionType.ADMIN, RestrictionType.TENANT_USER],
  })
  async removeTenant(
    ctx: Context<
      {
        id: number;
      },
      UserAuthMeta
    >,
  ) {
    const { id } = ctx.params;

    const tenant: Tenant = await ctx.call('tenants.resolve', { id, throwIfNotExist: true });

    await ctx.call(`${SN_TENANTUSERS}.removeUsers`, {
      tenantId: tenant.id,
    });

    await ctx.call('tenants.remove', { id: tenant.id });

    return {
      success: true,
    };
  }

  @Action({
    rest: 'GET /organizations',
  })
  async listOrganizations(ctx: Context<{}>) {
    const params = _.merge({}, ctx.params || {}, {
      scope: '-noParent',
      query: { tenantType: TenantTenantType.ORGANIZATION },
    });

    return ctx.call('tenants.list', params);
  }

  // todo: remove
  @Action({
    rest: <RestSchema>{
      method: 'GET',
      path: '/organizations/public',
    },
    auth: RestrictionType.PUBLIC,
    params: {
      pageSize: {
        type: 'number',
        convert: true,
        integer: true,
        optional: true,
        default: 10,
        min: 1,
      },
      page: {
        type: 'number',
        convert: true,
        integer: true,
        min: 1,
        optional: true,
        default: 1,
      },
    },
  })
  async publicOrganizations(
    ctx: Context<{
      [key: string]: any;
    }>,
  ) {
    const page = ctx?.params?.page;
    const pageSize = ctx?.params?.pageSize;
    const sort = ctx?.params?.sort;
    const query = ctx?.params?.query;

    const organizations: Tenant<'sportsBases'>[] = await this.findEntities(ctx, {
      fields: ['id', 'name', 'address', 'data', 'sportsBases', 'type'],
      populate: ['sportsBases', 'legalForm', 'type'],
      query: {
        tenantType: TenantTenantType.ORGANIZATION,
      },
    });

    const mappedOrganizations = organizations.map((organization) => {
      const mappedOrganization: any = {
        id: organization.id,
        name: organization.name,
        address: organization.address,
        type: organization.type,
      };

      if (query?.hasBeneficiaryStatus) {
        mappedOrganization.hasBeneficiaryStatus = organization?.data?.hasBeneficiaryStatus;
      }

      if (query?.nonGovernmentalOrganization) {
        mappedOrganization.nonGovernmentalOrganization =
          organization?.data?.nonGovernmentalOrganization;
      }

      if (query?.nonFormalEducation) {
        mappedOrganization.nonFormalEducation = organization?.data?.nonFormalEducation;
      }
      if (query?.sportType) {
        const uniqueSportTypeIds = this.getOrganizationUniqueSportTypes(organization).map(
          (sportType) => sportType.id,
        );

        mappedOrganization.sportType = uniqueSportTypeIds;
      }

      return mappedOrganization;
    });

    return handleFormatResponse({
      data: mappedOrganizations,
      page,
      pageSize,
      sort,
      search: query,
      fields: ['id', 'name', 'address', 'type'],
    });
  }

  // todo: remove
  @Action({
    rest: <RestSchema>{
      method: 'GET',
      path: '/organizations/:id/public',
    },
    auth: RestrictionType.PUBLIC,
    params: {
      id: {
        type: 'number',
        convert: true,
      },
    },
  })
  async publicOrganization(ctx: Context<{ id: string }>) {
    const organization: Tenant<'sportsBases'> = await this.findEntity(ctx, {
      ...ctx.params,
      fields: [
        'id',
        'name',
        'code',
        'sportsBases',
        'address',
        'email',
        'phone',
        'type',
        'legalForm',
        'data',
      ],
      populate: ['sportsBases', 'legalForm', 'type'],
      query: {
        id: ctx.params.id,
        tenantType: TenantTenantType.ORGANIZATION,
      },
    });

    if (!organization) {
      throwNotFoundError('Organization not found');
    }

    const { data, ...rest } = organization;

    const lastApprovedRequest: Request = await ctx.call(`${SN_REQUESTS}.findOne`, {
      query: {
        entityType: RequestEntityTypes.TENANTS,
        entity: organization.id,
        status: RequestStatus.APPROVED,
      },
      sort: '-updatedAt',
    });

    const uniqueSportTypes = this.getOrganizationUniqueSportTypes(organization);

    const sportsBases = organization?.sportsBases?.map((sportsBase) => ({
      name: sportsBase?.name,
      address: sportsBase?.address,
      sportTypes: getSportsBaseUniqueSportTypes(sportsBase),
    }));

    const mappedOrganization = {
      ...rest,
      sportTypes: uniqueSportTypes,
      sportsBases: sportsBases,
      url: data?.url,
      foundedAt: getFormattedDate(data?.foundedAt),
      lastApprovedRequestAt: getFormattedYear(lastApprovedRequest?.updatedAt),
    };

    return mappedOrganization;
  }

  @Action({
    rest: 'GET /institutions',
  })
  async listInstitutions(ctx: Context<{}>) {
    const params = _.merge({}, ctx.params || {}, {
      scope: '-noParent',
      query: { tenantType: { $in: [TenantTenantType.MUNICIPALITY] } },
    });

    return ctx.call('tenants.list', params);
  }

  getOrganizationUniqueSportTypes = (organization: Tenant<'sportsBases'>): SportType[] => {
    const sportTypes = organization.sportsBases.flatMap((sportsBase) =>
      sportsBase.spaces.flatMap((space) => space.sportTypes),
    );

    const uniqueSportTypes = Array.from(new Set(sportTypes.map((sportType) => sportType.name))).map(
      (name) => sportTypes.find((sportType) => sportType.name === name),
    );

    return uniqueSportTypes;
  };

  @Action({
    params: {
      id: 'number|convert',
    },
  })
  async getAvailableTenantIds(ctx: Context<{ id: number }>) {
    const { id } = ctx.params;

    const availableTenant: Tenant<'children'> = await ctx.call(`${SN_TENANTS}.resolve`, {
      id,
      populate: 'children',
      scopes: ['-user', '-noParent'],
    });

    const flattenChildren = (tenant: Tenant<'children'>): number[] => {
      const result: number[] = [];

      const getChildrenIds = (tenant: Tenant<'children'>) => {
        result.push(tenant.id);
        if (!!tenant.children?.length) {
          tenant.children.forEach((child) => getChildrenIds(child));
        }
      };

      getChildrenIds(tenant);
      return result;
    };

    return flattenChildren(availableTenant);
  }
}
