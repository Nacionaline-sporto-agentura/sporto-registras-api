'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../../../types';
import { SN_SPORTSBASES_INVESTMENTS_SOURCES } from '../../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}

export type SportBaseInvestmentSource<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_INVESTMENTS_SOURCES,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_INVESTMENTS_SOURCES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_INVESTMENTS_SOURCES),
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
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {
  async seedDB() {
    const data = [
      {
        name: 'ŠaltinisA',
      },
      {
        name: 'ŠaltinisB',
      },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
