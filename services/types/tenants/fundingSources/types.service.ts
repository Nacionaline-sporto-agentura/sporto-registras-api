'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../../../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  ONLY_GET_REST_ENABLED,
  Table,
} from '../../../../types';
import { tableName, tmpRestFix } from '../../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}

export type TenantFundingSourceType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_TENANTS_FUNDINGSOURCES_TYPES = 'types.tenants.fundingSources.types';

@Service({
  name: SN_TENANTS_FUNDINGSOURCES_TYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TENANTS_FUNDINGSOURCES_TYPES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_TENANTS_FUNDINGSOURCES_TYPES),
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      name: 'string',
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ONLY_GET_REST_ENABLED,
})
export default class extends moleculer.Service {
  async seedDB() {
    const data = [
      { name: 'Valstybės biudžetas' },
      { name: 'Savivaldybės biudžetas' },
      { name: 'Lietuvos tautinis olimpinis komitetas' },
      { name: 'Lėšos iš tarptautinių organizacijų' },
      { name: 'Ūkinė komercinė veikla' },
      { name: 'Rėmėjai ir kiti šaltiniai' },
      { name: 'Švietimo, mokslo ir sporto ministerija' },
      { name: 'Sporto rėmimo fondas' },
      { name: 'Kitų ministerijų, valstybės institucijų' },
      { name: 'Lietuvos tautinis olimpinis komitetas' },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
