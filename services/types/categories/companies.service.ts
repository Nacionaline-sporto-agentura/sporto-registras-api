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
import { TEMP_FAKE_TYPE_NAMES } from '../../../utils';

export interface TypeCategoryCompany extends CommonFields {
  id: number;
  name: string;
}

export const SN_TYPES_CATEGORIES_COMPANIES = 'types.categories.companies';

@Service({
  name: SN_TYPES_CATEGORIES_COMPANIES,
  mixins: [
    DbConnection({
      collection: 'typesCategoriesCompanies',
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
    await this.createEntities(null, TEMP_FAKE_TYPE_NAMES('Kategorijų įmonė'));
  }
}
