'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../types';
import { TEMP_FAKE_TYPE_NAMES, tableName } from '../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}
export type CompetitionType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_TYPES_COMPETITIONTYPES = 'types.competitionTypes';

@Service({
  name: SN_TYPES_COMPETITIONTYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_COMPETITIONTYPES),
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
    await this.createEntities(null, TEMP_FAKE_TYPE_NAMES('varžybų tipas'));
  }
}
