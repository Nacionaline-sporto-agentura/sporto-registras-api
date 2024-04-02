'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  Table,
} from '../types';
import { SportsBase } from './sportsBases.service';
import { Tenant } from './tenants.service';

interface Fields extends CommonFields {
  id: number;
  tenant: Tenant['id'];
  sportBase: SportsBase['id'];
  startAt: Date;
  endAt: Date;
}

interface Populates extends CommonPopulates {
  tenant: Tenant;
  sportBase: SportsBase;
}

export type SportsBaseTenant<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases.tenants',
  mixins: [
    DbConnection({
      collection: 'sportsBases',
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
      sportBase: {
        type: 'number',
        columnName: 'sportBaseId',
        immutable: true,
        optional: true,
        populate: 'sportsBases.resolve',
      },
      startAt: {
        type: 'date',
        columnType: 'datetime',
      },
      endAt: {
        type: 'date',
        columnType: 'datetime',
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
export default class SportsBasesTenantsService extends moleculer.Service {}
