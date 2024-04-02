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
import { SportBaseInvestmentSource } from './sportsBases.investments.sources.service';

interface Fields extends CommonFields {
  id: number;
  fundsAmount: number;
  improvements: string;
  appointedAt: Date;
  sportBase: Date;
  source: number | SportBaseInvestmentSource;
}

interface Populates extends CommonPopulates {}

export type SportBaseInvestment<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases.investments',
  mixins: [
    DbConnection({
      collection: 'sportsBasesInvestments',
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
      source: {
        type: 'number',
        columnName: 'sourceId',
        required: true,
        populate: 'source.resolve',
      },
      sportBase: {
        type: 'number',
        columnName: 'sportBaseId',
        required: true,
        populate: 'sportsBases.resolve',
      },
      fundsAmount: 'number',
      improvements: 'string',
      appointedAt: {
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
export default class SportsBasesInvestmentsService extends moleculer.Service {}
