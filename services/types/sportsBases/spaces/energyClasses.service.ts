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
import { tableName, tmpRestFix } from '../../../../utils';

export interface SportBaseSpaceEnergyClass extends CommonFields {
  id: number;
  name: string;
}

export const SN_SPORTSBASES_SPACES_ENERGYCLASSES = 'types.sportsBases.spaces.energyClasses';

@Service({
  name: SN_SPORTSBASES_SPACES_ENERGYCLASSES,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_SPACES_ENERGYCLASSES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_SPACES_ENERGYCLASSES),
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
    const data = [
      { name: 'Nenurodyta / Nėra' },
      { name: 'A++' },
      { name: 'A+' },
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' },
      { name: 'E' },
      { name: 'F' },
      { name: 'G' },
    ];
    await this.createEntities(null, data);
  }
}
