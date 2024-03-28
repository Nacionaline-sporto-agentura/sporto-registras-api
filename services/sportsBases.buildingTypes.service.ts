'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import { COMMON_DEFAULT_SCOPES, COMMON_FIELDS, CommonFields } from '../types';

export interface SportsBasesBuildingType extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: 'sportsBases.buildingTypes',
  mixins: [
    DbConnection({
      collection: 'sportsBasesBuildingTypes',
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
export default class SportsBasesBuildingTypesService extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      { name: 'Viešieji pastatai' },
      { name: 'Inžineriniai statiniai' },
      { name: 'Laikinoji statyba' },
      { name: 'Sporto objektai' },
    ];
    await this.createEntities(null, data);
  }
}
