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
  CommonPopulates,
  Table,
} from '../../../types';
import { SN_TYPES_COMPETITIONS_RESULT_TYPES } from '../../../types/serviceNames';
import { tableName } from '../../../utils';

export enum FieldTypes {
  NONE = 'NONE',
  RANGE = 'RANGE',
  NUMBER = 'NUMBER',
}
interface Fields extends CommonFields {
  id: number;
  name: string;
  type: keyof typeof FieldTypes;
}

interface Populates extends CommonPopulates {}
export type ResultType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_TYPES_COMPETITIONS_RESULT_TYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_COMPETITIONS_RESULT_TYPES),
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
      type: {
        type: 'enum',
        values: Object.values(FieldTypes),
        required: true,
      },
      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      { name: 'Užimta vieta', type: FieldTypes.NUMBER },
      { name: 'Nestartavo', type: FieldTypes.NONE },
      { name: 'Nefinišavo', type: FieldTypes.NONE },
      { name: 'Diskvalifikuotas', type: FieldTypes.NONE },
      { name: 'Rėžis nuo iki', type: FieldTypes.RANGE },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
