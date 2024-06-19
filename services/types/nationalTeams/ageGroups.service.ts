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

export interface TypeNationalTeamAgeGroup extends CommonFields {
  id: number;
  name: string;
}

export const SN_TYPES_NATIONAL_TEAM_AGE_GROUP = 'types.nationalTeam.ageGroups';

@Service({
  name: SN_TYPES_NATIONAL_TEAM_AGE_GROUP,
  mixins: [
    DbConnection({
      collection: 'typesNationalTeamAgeGroups',
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
    await this.createEntities(null, TEMP_FAKE_TYPE_NAMES('Nacionalinės rinktinės amžiaus grupė'));
  }
}
