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
import { SN_TYPES_SPORTSPERSONS_VIOLATIONS_ANTIDOPING } from '../../../types/serviceNames';
import { TEMP_FAKE_TYPE_NAMES, tableName } from '../../../utils';

export interface ViolationAntiDoping extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: SN_TYPES_SPORTSPERSONS_VIOLATIONS_ANTIDOPING,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_SPORTSPERSONS_VIOLATIONS_ANTIDOPING),
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
    await this.createEntities(null, TEMP_FAKE_TYPE_NAMES('anti-doping pažeidimas'));
  }
}
