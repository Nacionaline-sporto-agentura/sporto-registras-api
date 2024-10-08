'use strict';
import moleculer, { Context } from 'moleculer';
import { Event, Service } from 'moleculer-decorators';
import DbConnection from '../../../mixins/database.mixin';

import RequestMixin from '../../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  EntityChangedParams,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../../types';
import {
  SN_SPORTSBASES_INVESTMENTS,
  SN_SPORTSBASES_INVESTMENTS_ITEMS,
  SN_SPORTSBASES_INVESTMENTS_SOURCES,
} from '../../../types/serviceNames';
import { SportBaseInvestmentSource } from '../../types/sportsBases/investments/sources.service';
import { SportBaseInvestment } from './index.service';

interface Fields extends CommonFields {
  id: number;
  sportBaseInvestment: SportBaseInvestment['id'];
  source: SportBaseInvestmentSource['id'];
  fundsAmount: number;
}

interface Populates extends CommonPopulates {
  sportBaseInvestment: SportBaseInvestment;
  source: SportBaseInvestmentSource;
}

export type SportBaseInvestmentItem<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_INVESTMENTS_ITEMS,
  mixins: [
    DbConnection({
      collection: 'sportsBasesInvestmentsItems',
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

      sportBaseInvestment: {
        type: 'number',
        columnName: 'sportBaseInvestmentId',
        required: true,
        populate: `${SN_SPORTSBASES_INVESTMENTS}.resolve`,
      },

      source: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseInvestmentSourceId',
        required: true,
        populate: {
          action: `${SN_SPORTSBASES_INVESTMENTS_SOURCES}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },

      fundsAmount: 'number',

      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {
  @Event()
  async 'sportsBases.investments.removed'(ctx: Context<EntityChangedParams<SportBaseInvestment>>) {
    const sportBaseInvestment = ctx.params.data as SportBaseInvestment;

    await this.removeEntities(ctx, {
      query: {
        sportBaseInvestment: sportBaseInvestment.id,
      },
    });
  }
}
