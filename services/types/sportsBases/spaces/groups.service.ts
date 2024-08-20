'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../../../types';
import { SN_SPORTSBASES_SPACES_GROUPS } from '../../../../types/serviceNames';
import { tableName } from '../../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
}

interface Populates extends CommonPopulates {}

export type SportBaseSpaceGroup<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_SPACES_GROUPS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_SPACES_GROUPS),
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
      { name: 'Uždarų patalpų erdvės' },
      { name: 'Lauko aikštynai' },
      { name: 'Kitos lauko erdvės' },
      { name: 'Baseinai' },
      { name: 'Šaudyklos' },
      { name: 'Žiemos sporto erdvės' },
      { name: 'Techninio sporto erdvės' },
      { name: 'Žirgų sporto erdvės' },
      { name: 'Pagalbinės patalpos' },
      { name: 'Apgyvendinimo, maitinimo, konferencinės erdvės' },
    ];
    await this.createEntities(null, data);
  }
}
