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
  name: 'sportsBases.investments.sources',
  mixins: [
    DbConnection({
      collection: 'sportsBasesInvestmentsSources',
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
export default class SportsBasesInvestmentsSourcesService extends moleculer.Service {
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
