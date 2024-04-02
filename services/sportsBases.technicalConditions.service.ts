'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import { COMMON_DEFAULT_SCOPES, COMMON_FIELDS, CommonFields } from '../types';

export interface SportsBasesCondition extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: 'sportsBases.technicalConditions',
  mixins: [
    DbConnection({
      collection: 'sportsBasesTechnicalConditions',
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
export default class SportsBasesTechnicalConditionsService extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      {
        name: 'Puiki',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra visiškai veikianti, nepažeista ir atitinka aukštus standartus bei reikalavimus',
      },
      {
        name: 'Gera',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra veikianti, minimaliai pažeista ar susidūrusi su nedideliais techniniais trūkumais, tačiau jie neturi didelės įtakos naudojimo galimybėms ar saugumui',
      },
      {
        name: 'Vidutinė',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra funkcionuojanti, tačiau gali būti pastebimų trūkumų ar pažeidimų, kurie reikalauja dėmesio ir remonto',
      },
      {
        name: 'Bloga',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra prastesnės būklės, dėl kurios gali kilti saugumo ar veikimo problemų, reikalaujančių skubaus remonto ar pakeitimo',
      },
      {
        name: 'Labai bloga',
        description:
          'Sporto bazės infrastruktūra ir techninė įranga yra labai sugedusi arba neveikianti, todėl naudojimas yra beveik neįmanomas arba pavojingas, reikalingas nedelsiantinis remontas ar pakeitimas',
      },
    ];
    await this.createEntities(null, data);
  }
}
