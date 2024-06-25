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
import { SN_SPORTSBASES_LEVELS } from '../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../utils';

export interface SportsBasesLevel extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: SN_SPORTSBASES_LEVELS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_LEVELS),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_LEVELS),
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
      {
        name: 'Vietinė sporto bazė',
        description: 'Mažos apimties sporto objektai, skirti vietiniam bendruomenės naudojimui.',
      },
      {
        name: 'Miesto sporto bazė',
        description: 'Sporto bazės, skirtos miesto gyventojams ir aplinkinių vietovių gyventojams.',
      },
      {
        name: 'Regioninė sporto bazė',
        description: 'Sporto bazės, aptarnaujančios didesnį regioną ar kelias miesto apylinkes.',
      },
      {
        name: 'Nacionalinė sporto bazė',
        description:
          'Didelės šalies sporto bazės, skirtos nacionalinio masto renginiams ir varžyboms.',
      },
      {
        name: 'Tarptautinė sporto bazė',
        description:
          'Sporto bazės, kurios yra skirtos tarptautiniams sporto renginiams, pavyzdžiui, olimpinėms žaidynėms, pasaulio čempionatams ir kitoms tarptautinėms varžyboms.',
      },
    ];
    await this.createEntities(null, data);
  }
}
