'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../../mixins/database.mixin';
import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
} from '../../../types';
import { TEMP_FAKE_TYPE_NAMES, tableName } from '../../../utils';

export interface ViolationResultsManipulation extends CommonFields {
  id: number;
  name: string;
}

export const SN_TYPES_SPORTSPERSONS_VIOLATIONS_RESULTS_MANIPULATION =
  'types.sportsPersons.violationsResultsManipulation';

@Service({
  name: SN_TYPES_SPORTSPERSONS_VIOLATIONS_RESULTS_MANIPULATION,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_SPORTSPERSONS_VIOLATIONS_RESULTS_MANIPULATION),
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
export default class extends moleculer.Service {
  @Method
  async seedDB() {
    await this.createEntities(null, TEMP_FAKE_TYPE_NAMES('rezultatų manipuliavimo pažeidimas'));
  }
}
