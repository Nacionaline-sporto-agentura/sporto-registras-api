'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
} from '../types';

export interface SportsBasesTenantsBasis extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: 'sportsBases.tenants.basis',
  mixins: [
    DbConnection({
      collection: 'sportsBasesTenantsBasis',
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
export default class SportsBasesTenantsBasisService extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      { name: 'TODO: Basis 1' },
      { name: 'TODO: Basis 2' },
      { name: 'TODO: Basis 3' },
      { name: 'TODO: Basis 4' },
    ];
    await this.createEntities(null, data);
  }
}
