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
import { SN_TYPES_VIOLATIONS_DISQUALIFICATION_REASONS } from '../../../types/serviceNames';
import { tableName } from '../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}
interface Populates extends CommonPopulates {}

export type DisqualificationReason<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_TYPES_VIOLATIONS_DISQUALIFICATION_REASONS,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_VIOLATIONS_DISQUALIFICATION_REASONS),
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
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      { name: 'Buvimas mėginyje' },
      { name: 'Vartojimas ar bandymas vartoti (naudojimas)' },
      { name: 'Vengimas ar atsisakymas' },
      { name: 'Su buvimo vieta susiję pažeidimai (12 mėn)' },
      { name: 'Kliudymas' },
      { name: 'Turėjimas' },
      { name: 'Prekyba ar bandymas prekiauti' },
      { name: 'Paskyrimas (išrašymas)' },
      { name: 'Bendrininkavimas' },
      { name: 'Draudžiami ryšiai' },
      {
        name: 'Sportininko arba kito asmens veiksmai siekiant atgrasinti nuo pranešimo institucijoms arba už tai atkeršyti',
      },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
