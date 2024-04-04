'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import RequestMixin from '../mixins/request.mixin';
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
} from '../types';
import { SportBaseInvestmentSource } from './sportsBases.investments.sources.service';

interface Fields extends CommonFields {
  id: number;
  fundsAmount: number;
  improvements: string;
  appointedAt: Date;
  sportBase: Date;
  source: number;
}

interface Populates extends CommonPopulates {
  source: SportBaseInvestmentSource;
}

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
      source: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sourceId',
        required: true,
        populate: {
          action: 'sportsBases.investments.sources.resolve',
          params: {
            fields: 'id,name',
          },
        },
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
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class SportsBasesInvestmentsService extends moleculer.Service {}
