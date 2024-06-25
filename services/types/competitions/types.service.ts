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
import { SN_TYPES_COMPETITIONS_TYPES } from '../../../types/serviceNames';
import { tableName } from '../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}
export type CompetitionType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_TYPES_COMPETITIONS_TYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_COMPETITIONS_TYPES),
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
    const data = [
      { name: 'Vasaros olimpinės žaidynės' },
      { name: 'Žiemos olimpinės žaidynės' },
      { name: 'Europos žaidynės' },
      { name: 'Pasaulio jaunimo olimpinės žaidynės' },
      { name: 'Pasaulio čempionatas' },
      { name: 'Pasaulio taurės finalinės varžybos' },
      { name: 'Pasaulio taurės etapas' },
      { name: 'Pasaulio jaunimo čempionatas' },
      { name: 'Pasaulio jaunių čempionatas' },
      { name: 'Europos čempionatas' },
      { name: 'Europos jaunimo čempionatas' },
      { name: 'Europos jaunių čempionatas' },
      { name: 'Europos taurės finalinės varžybos' },
      { name: 'Europos taurės etapas' },
      { name: 'Europos jaunimo vasaros olimpinis festivalis' },
      { name: 'Europos jaunimo žiemos olimpinis festivalis' },
      { name: 'Vasaros universiada' },
      { name: 'Žiemos universiada' },
      { name: 'Pasaulio šachmatų olimpiada' },
      { name: 'Paralimpinės žaidynės' },
      { name: 'Kurčiųjų žaidynės' },
      { name: 'Pasaulio asmenų su negalia čempionatas' },
      { name: 'Pasaulio jaunimo asmenų su negalia čempionatas' },
      { name: 'Europos asmenų su negalia čempionatas' },
      { name: 'Europos jaunimo asmenų su negalia čempionatas' },
      { name: 'Specialiosios olimpiados žaidynės' },
      { name: 'Lietuvos suaugusiųjų čempionatas' },
      { name: 'Lietuvos jaunimo čempionatas' },
      { name: 'Lietuvos jaunių čempionatas' },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
