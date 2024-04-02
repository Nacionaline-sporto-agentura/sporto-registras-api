'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  Table,
  throwValidationError,
} from '../types';
import { Tenant } from './tenants.service';
import { User } from './users.service';

interface Fields extends CommonFields {
  id: number;
  tenant: Tenant['id'];
  user: User['id'];
  sportBase: SportsBase['id'];
}

interface ViispUser {
  personalCode: string;
  firstName: string;
  lastName: string;
}

interface ViispCompany {
  companyCode: string;
  name: string;
}

interface Populates extends CommonPopulates {
  user: User;
  tenant: Tenant;
  sportBase: SportsBase;
}

export type SportsBase<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases.owners',
  mixins: [
    DbConnection({
      collection: 'sportsBasesOwners',
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
  },
  actions: {
    create: {
      rest: null,
    },
    update: {
      rest: null,
    },
    remove: {
      rest: null,
    },
  },
})
export default class SportsBasesOwnerService extends moleculer.Service {
  @Action({
    params: {
      owner: [
        {
          type: 'object',
          properties: {
            personalCode: 'string',
            firstName: 'string',
            lastName: 'string',
          },
        },
        {
          type: 'object',
          properties: {
            companyCode: 'string',
            name: 'string',
          },
        },
      ],
      sportBase: 'number|required',
    },
  })
  async assign(
    ctx: Context<{
      owner: ViispUser & ViispCompany;
      sportBase: number;
    }>,
  ) {
    const { sportBase, owner } = ctx.params;
    let user = null;
    let tenant = null;

    const authUser = await ctx.call('auth.users.invite', {
      ...owner,
      throwErrors: false,
    });

    if (!!owner?.personalCode) {
      const { firstName, lastName } = owner;

      const newOrExistingUser: User = await ctx.call('users.findOrCreate', {
        authUser,
        firstName,
        lastName,
      });

      user = newOrExistingUser.id;
    } else if (!!owner?.companyCode) {
      const { name } = owner;

      const newOrExistingTenant: Tenant = await ctx.call('tenants.findOrCreate', {
        authGroup: authUser,
        name,
      });

      tenant = newOrExistingTenant.id;
    } else {
      throwValidationError('invalid owner');
    }

    return this.createEntity(ctx, { sportBase, user, tenant });
  }
}
