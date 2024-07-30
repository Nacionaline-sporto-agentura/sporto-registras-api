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
import { SN_TYPES_EDUCATIONAL_COMPANIES } from '../../types/serviceNames';
import { TEMP_FAKE_TYPE_NAMES, tableName } from '../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
  code: string;
}

interface Populates extends CommonPopulates {}

export type EducationalCompany<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_TYPES_EDUCATIONAL_COMPANIES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_EDUCATIONAL_COMPANIES),
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
      code: 'string',
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
    await this.createEntities(
      null,
      TEMP_FAKE_TYPE_NAMES('Mokymosi įstaiga').map((o) => ({ ...o, code: 111 })),
    );
  }
}
