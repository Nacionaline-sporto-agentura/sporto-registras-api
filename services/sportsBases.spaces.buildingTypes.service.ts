'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
} from '../types';

export interface SportsBasesSpacesBuildingType extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: 'sportsBases.spaces.buildingTypes',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpacesBuildingTypes',
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
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class SportsBasesSpacesBuildingTypesService extends moleculer.Service {
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
