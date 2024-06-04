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
  name: 'tenants.sportOrganizationTypes',
  mixins: [
    DbConnection({
      collection: 'tenantSportOrganizationTypes',
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
      name: 'string',
      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class TenantsSportOrganizationTypesService extends moleculer.Service {
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
