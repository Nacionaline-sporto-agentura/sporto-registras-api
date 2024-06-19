'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
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
import { tableName, tmpRestFix } from '../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}

export type TenantLegalForms<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_TENANTS_LEGALFORMS = 'types.tenants.legalForms';

@Service({
  name: SN_TENANTS_LEGALFORMS,
  mixins: [
    DbConnection({
      collection: tableName(SN_TENANTS_LEGALFORMS),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_TENANTS_LEGALFORMS),
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
  async seedDB() {
    const data = [
      { name: 'Asociacija' },
      { name: 'Akcinė bendrovė' },
      { name: 'Biudžetinė įstaiga' },
      { name: 'Individuali įmonė' },
      { name: 'Kooperatinė bendrovė' },
      { name: 'Labdaros ir paramos fondas' },
      { name: 'Mažoji bendrija' },
      { name: 'Prekybos pramonės ir amatų rūmai' },
      { name: 'Savivaldybės' },
      { name: 'Valstybės įmonė' },
      { name: 'Sodų bendrija' },
      { name: 'Ūkinė bendrija' },
      { name: 'Uždaroji akcinė bendrovė' },
      { name: 'Užsienio įmonė' },
      { name: 'Užsienio kapitalo bendrovė' },
      { name: 'Viešoji įstaiga' },
      { name: 'Visuomeninė organizacija' },
      { name: 'Žemės ūkio bendrovė' },
      { name: 'Tradicinė religinė bendruomenė ar bendrija' },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
