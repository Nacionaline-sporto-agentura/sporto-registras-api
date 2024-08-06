'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';

import RequestMixin from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_SPORTSBASES,
  SN_SPORTSBASES_TENANTS,
  SN_SPORTSBASES_TENANTS_BASIS,
} from '../../types/serviceNames';
import { SportsBasesTenantsBasis } from '../types/sportsBases/tenants/basis.service';
import { SportsBase } from './index.service';

interface Fields extends CommonFields {
  id: number;
  sportBase: SportsBase['id'];
  companyName: string;
  companyCode: string;
  basis: SportsBasesTenantsBasis['id'];
  startAt: Date;
  endAt: Date;
}

interface Populates extends CommonPopulates {
  sportBase: SportsBase;
  basis: SportsBasesTenantsBasis;
}

export type SportsBaseTenant<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_TENANTS,
  mixins: [
    DbConnection({
      collection: 'sportsBasesTenants',
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
      sportBase: {
        type: 'number',
        columnName: 'sportBaseId',
        immutable: true,
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      companyName: 'string|required',
      companyCode: 'string|required',
      basis: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportsBasesTenantsBasisId',
        immutable: true,
        populate: `${SN_SPORTSBASES_TENANTS_BASIS}.resolve`,
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
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {}
