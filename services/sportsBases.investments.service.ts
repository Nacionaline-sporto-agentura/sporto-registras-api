'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../mixins/database.mixin';

import RequestMixin from '../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  Table,
} from '../types';
import { SportBaseInvestmentItem } from './sportsBases.investments.items.service';
import { SportsBase } from './sportsBases.service';

interface Fields extends CommonFields {
  id: number;
  improvements: string;
  appointedAt: Date;
  sportBase: SportsBase['id'];
  items: undefined;
}

interface Populates extends CommonPopulates {
  sportBase: SportsBase;
  items: Array<SportBaseInvestmentItem<'source'>>;
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

      sportBase: {
        type: 'number',
        columnName: 'sportBaseId',
        required: true,
        populate: 'sportsBases.resolve',
      },

      improvements: 'string',

      appointedAt: {
        type: 'date',
        columnType: 'datetime',
      },

      items: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('sportsBases.investments.items.populateByProp'),
          params: {
            queryKey: 'sportBaseInvestment',
            mappingMulti: true,
            populate: ['source'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: 'sportsBases.investments.items',
          relationField: 'sportBaseInvestment',
        },
      },

      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class SportsBasesInvestmentsService extends moleculer.Service {}
