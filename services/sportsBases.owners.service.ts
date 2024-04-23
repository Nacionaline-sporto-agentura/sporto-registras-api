'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import RequestMixin, { RequestMutationPreHook } from '../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  Table,
  throwValidationError,
} from '../types';
import { SportsBase } from './sportsBases.service';
import { Tenant } from './tenants.service';
import { User } from './users.service';

interface Fields extends CommonFields {
  id: number;
  tenant: Tenant['id'];
  user: User['id'];
  sportBase: SportsBase['id'];
}

interface ViispUser {
  sportBase: SportsBaseOwner['sportBase'];
  personalCode: string;
  firstName: string;
  lastName: string;
}

interface ViispCompany {
  sportBase: SportsBaseOwner['sportBase'];
  companyCode: string;
  name: string;
}

interface Populates extends CommonPopulates {
  user: User;
  tenant: Tenant;
  sportBase: SportsBase;
}

export type SportsBaseOwner<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases.owners',
  mixins: [
    DbConnection({
      collection: 'sportsBasesOwners',
    }),
    RequestMixin,
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
        optional: true,
        populate: 'tenants.resolve',
      },
      user: {
        type: 'number',
        columnName: 'userId',
        immutable: true,
        optional: true,
        populate: 'users.resolve',
      },
      sportBase: {
        type: 'number',
        columnName: 'sportBaseId',
        immutable: true,
        optional: true,
        populate: 'sportsBases.resolve',
      },
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class SportsBasesOwnerService extends moleculer.Service {
  @Method
  async requestMutationPreHook({
    type,
    ctx,
    data,
  }: RequestMutationPreHook<ViispUser & ViispCompany>) {
    if (['create', 'update'].includes(type)) {
      const owner: Partial<SportsBaseOwner> = {};
      owner.sportBase = data.sportBase;

      const authUser = await ctx.call(
        'auth.users.invite',
        {
          ...data,
          throwErrors: false,
        },
        { meta: ctx.meta },
      );

      if (!!data?.personalCode) {
        const { firstName, lastName } = data;

        const newOrExistingUser: User = await ctx.call('users.findOrCreate', {
          authUser,
          firstName,
          lastName,
        });

        owner.user = newOrExistingUser.id;
      } else if (!!data?.companyCode) {
        const { name } = data;

        const newOrExistingTenant: Tenant = await ctx.call('tenants.findOrCreate', {
          authGroup: authUser,
          name,
        });

        owner.tenant = newOrExistingTenant.id;
      } else {
        throwValidationError('invalid owner');
      }

      return owner;
    }

    return data;
  }
}
