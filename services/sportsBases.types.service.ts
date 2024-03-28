'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';
import { COMMON_DEFAULT_SCOPES, COMMON_FIELDS, CommonFields } from '../types';

export interface SportsBasesType extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: 'sportsBases.types',
  mixins: [
    DbConnection({
      collection: 'sportsBasesTypes',
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
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: {
    create: {
      rest: null,
    },
    update: {
      rest: null,
    },
    remove: {
      rest: null,
    },
  },
})
export default class SportsBasesTypesService extends moleculer.Service {
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
