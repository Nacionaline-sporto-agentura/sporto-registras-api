'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
} from '../../../../types';
import { SN_SPORTSBASES_TENANTS_BASIS } from '../../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../../utils';

export interface SportsBasesTenantsBasis extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: SN_SPORTSBASES_TENANTS_BASIS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_TENANTS_BASIS),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_TENANTS_BASIS),
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
  @Method
  async seedDB() {
    const data = [{ name: 'Nuoma' }, { name: 'Panauda' }, { name: 'Koncesija' }, { name: 'Kita' }];
    await this.createEntities(null, data);
  }
}
