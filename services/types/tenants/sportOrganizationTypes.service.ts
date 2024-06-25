'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../../types';
import { SN_TENANTS_SPORTORGANIZATIONTYPES } from '../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}

export type TenantSportOrganizationTypes<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_TENANTS_SPORTORGANIZATIONTYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TENANTS_SPORTORGANIZATIONTYPES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_TENANTS_SPORTORGANIZATIONTYPES),
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
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class extends moleculer.Service {
  async seedDB() {
    const data = [
      { name: 'Sporto klubas' },
      { name: 'Fizinio aktyvumo organizacija' },
      { name: 'Sporto federacija' },
      { name: 'Bendrojo ugdymo mokykla' },
      { name: 'Sporto rengimo centras' },
      { name: 'Kita' },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
