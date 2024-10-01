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
  FieldHookCallback,
} from '../../../types';
import { SN_SPORTSBASES_TECHNICALCONDITIONS } from '../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../utils';

export interface SportsBasesTechnicalCondition extends CommonFields {
  id: number;
  name: string;
  description: string;
  color: string;
}

@Service({
  name: SN_SPORTSBASES_TECHNICALCONDITIONS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_TECHNICALCONDITIONS),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_TECHNICALCONDITIONS),
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },

      name: 'string',
      description: 'string',

      color: {
        type: 'string',
        validate({ value }: FieldHookCallback) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) || 'Color is not valid';
        },
      },

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
      {
        name: 'Puiki',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra visiškai veikianti, nepažeista ir atitinka aukštus standartus bei reikalavimus',
        color: '#ffffff',
      },
      {
        name: 'Gera',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra veikianti, minimaliai pažeista ar susidūrusi su nedideliais techniniais trūkumais, tačiau jie neturi didelės įtakos naudojimo galimybėms ar saugumui',
        color: '#ffffff',
      },
      {
        name: 'Vidutinė',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra funkcionuojanti, tačiau gali būti pastebimų trūkumų ar pažeidimų, kurie reikalauja dėmesio ir remonto',
        color: '#ffffff',
      },
      {
        name: 'Bloga',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra prastesnės būklės, dėl kurios gali kilti saugumo ar veikimo problemų, reikalaujančių skubaus remonto ar pakeitimo',
        color: '#ffffff',
      },
      {
        name: 'Labai bloga',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra labai sugedusi arba neveikianti, todėl naudojimas yra beveik neįmanomas arba pavojingas, reikalingas nedelsiantinis remontas ar pakeitimas',
        color: '#ffffff',
      },
    ];
    await this.createEntities(null, data);
  }
}
