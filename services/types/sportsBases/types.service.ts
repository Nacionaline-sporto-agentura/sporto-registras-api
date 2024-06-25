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
import { SN_SPORTSBASES_TYPES } from '../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../utils';

export interface SportsBasesType extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: SN_SPORTSBASES_TYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_TYPES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_TYPES),
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
    const data = [
      { name: 'Uždarų patalpų erdvės' },
      { name: 'Baseinai' },
      { name: 'Šaudyklos' },
      { name: 'Auto / Moto sporto trasos' },
      { name: 'Slidinėjimo trasos' },
      { name: 'Kitos sporto šakų erdvės' },
      { name: 'Kitos lauko sporto erdvės' },
      { name: 'Ledo arenos' },
      { name: 'Žirginis sportas' },
      { name: 'Kitos vidaus sporto erdvės' },
      { name: 'Pagalbinės patalpos' },
      { name: 'Stadionas ' },
      { name: 'Lauko aikštynai' },
      { name: 'Dviračių trekas' },
    ];
    await this.createEntities(null, data);
  }
}
