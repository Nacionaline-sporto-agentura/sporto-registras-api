'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  Table,
} from '../types';
import { SportsBasesType } from './sportsBases.types.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  type: SportsBasesType['id'];
}

interface Populates extends CommonPopulates {}
export type SportBaseSpaceSportType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;
@Service({
  name: 'sportsBases.spaces.sportTypes',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpacesSportTypes',
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
export default class SportsTypesService extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      {
        name: 'Krepšinis',
      },
      { name: 'Fulbolas' },
      {
        name: 'Tenisas',
      },
      {
        name: 'Dailusis čiuožimas',
      },
      {
        name: 'Rankinis',
      },
      {
        name: 'Salės fulbolas',
      },
    ];

    await this.createEntities(null, data);
  }
}
