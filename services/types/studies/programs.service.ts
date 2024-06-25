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
import { SN_TYPES_STUDIES_COMPANIES, SN_TYPES_STUDIES_PROGRAMS } from '../../../types/serviceNames';
import { TEMP_FAKE_TYPE_NAMES } from '../../../utils';

export interface TypeStudiesProgram extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: SN_TYPES_STUDIES_PROGRAMS,
  mixins: [
    DbConnection({
      collection: 'typesStudiesPrograms',
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

      company: {
        columnName: 'studiesCompanyId',
        immutable: true,
        optional: true,
        populate: `${SN_TYPES_STUDIES_COMPANIES}.resolve`,
      },

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
      TEMP_FAKE_TYPE_NAMES('Studijų programa', 10).map((i) => ({
        ...i,
        company: Math.ceil(Math.random() * 2), // random company
      })),
    );
  }
}
