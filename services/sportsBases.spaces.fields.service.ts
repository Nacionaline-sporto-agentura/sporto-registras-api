'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  Table,
} from '../types';

export const FieldTypes = {
  SELECT: 'SELECT',
  TEXT: 'TEXT',
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
};

interface Fields extends CommonFields {
  id: number;
  title: string;
  precision?: number;
  scale?: number;
  options: any[];
  type: keyof typeof FieldTypes;
}

interface Populates extends CommonPopulates {}

export type SportBaseSpaceField<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases.spaces.fields',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpacesFields',
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
      title: 'string',
      precision: 'number|optional',
      scale: 'number|optional',
      type: {
        type: 'string',
        enum: Object.values(FieldTypes),
        required: true,
      },

      options: {
        type: 'array',
        columnType: 'json',
        optional: true,
        items: 'string',
      },
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
export default class SportsBasesSpacesFieldsService extends moleculer.Service {
  @Method
  async seedDB() {
    const data: any = [
      { title: 'Plotas (m2)', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Ilgis (m)', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Plotis (m)', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Aukštis (m)', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Stacionarios žiūrovų vietos', type: 'NUMBER' },
      { title: 'Kilnojamos žiūrovų vietos', type: 'NUMBER' },
      { title: 'Žiūrovų vietos (iš viso)', type: 'NUMBER' },
      {
        title: 'Pritaikyta judėjimo negalią turintiems asmenims',
        type: 'BOOLEAN',
      },
      {
        title: 'Pritaikyta regos negalią turintiems asmenims',
        type: 'BOOLEAN',
      },
      { title: 'Elektroninės švieslentės', type: 'BOOLEAN' },
      { title: 'Papildoma informacija apie el. švieslentes', type: 'TEXT' },
      { title: 'Stacionari  įgarsinimo sistema', type: 'BOOLEAN' },
      { title: 'Keičiama grindų danga', type: 'BOOLEAN' },
      { title: 'Grindų dangos specifika', type: 'TEXT' },
      { title: 'Apšviestumas (lx)', type: 'NUMBER' },
      { title: 'Kilnojamos pertvaros', type: 'BOOLEAN' },
      { title: 'Danga', type: 'SELECT', options: ['Parketas', 'Dirbtinė danga', 'Kita'] },
      { title: 'Papildoma informacija', type: 'TEXT' },
      { title: 'Turėklas', type: 'BOOLEAN' },
      { title: 'Veidrodinė siena', type: 'BOOLEAN' },
      { title: 'Įranga / Aparašymas', type: 'TEXT' },
      {
        title: 'Ovalo takelių ilgis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Ovalo takelių skaičius', type: 'NUMBER' },
      {
        title: 'Tiesiosios takelio ilgis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Tiesiosios takelių skaičius', type: 'NUMBER' },
      { title: 'Rutulio stūmimo sektorius', type: 'BOOLEAN' },
      { title: 'Trišuolio erdvė', type: 'BOOLEAN' },
      { title: 'Šuolio su kartimi erdvė', type: 'BOOLEAN' },
      { title: 'Šuolio į aukštį erdvė', type: 'BOOLEAN' },
      { title: 'Dirbtinis apšvietimas', type: 'BOOLEAN' },
      {
        title: 'Futbolo aikštės ilgis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      {
        title: 'Futbolo aikštės plotis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Plaukimo takelių skaičius', type: 'NUMBER' },
      {
        title: 'Minimalus gylis (m)',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      {
        title: 'Maksimalus gylis (m)',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Laiko matavimo sistema', type: 'BOOLEAN' },
      {
        title: 'Papildoma informacija apie laiko matavimo įrangą',
        type: 'TEXT',
      },
      { title: 'Trasos ilgis', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Trasos plotis ', type: 'NUMBER', precision: 10, scale: 2 },
      {
        title: 'Važiavimo kryptis',
        type: 'SELECT',
        options: ['Pagal laikrodžio rodyklę', 'Prieš laikrodžio rodyklę'],
      },
      { title: 'Starto vietų skaičius', type: 'NUMBER' },
      {
        title: 'Aukščių skirtumas',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      {
        title: 'Maksimalus šaudyklos ilgis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Taikinių skaičius', type: 'NUMBER' },
      { title: 'Elektroniniai taikiniai', type: 'BOOLEAN' },
      { title: 'Judantys taikiniai', type: 'BOOLEAN' },
      { title: 'Pakilimo tako parametrai', type: 'TEXT' },
      { title: 'Vandens telkinys', type: 'TEXT' },
      { title: 'Prieplaukų skaičius', type: 'NUMBER' },
      {
        title: 'Maksimali grimzlė',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Valtinė', type: 'TEXT' },
      { title: 'Krepšių skaičius', type: 'NUMBER' },
      { title: 'Takelių skaičius', type: 'NUMBER' },
      { title: 'Sienos plotis', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Sienos aukštis', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Kliūtys', type: 'TEXT' },
      { title: 'Ovalo ilgis', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Ovalo plotis', type: 'NUMBER', precision: 10, scale: 2 },
      {
        title: 'Vidurio aikštės ilgis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      {
        title: 'Vidurio aikštės plotis',
        type: 'NUMBER',
        precision: 10,
        scale: 2,
      },
      { title: 'Vidurio aikštės danga', type: 'SELECT', options: ['Žolė', 'Dirbtinė veja'] },
      { title: 'Smėlio gylis', type: 'NUMBER', precision: 10, scale: 2 },
      { title: 'Holes', type: 'NUMBER' },
      { title: 'Plotas (m2)', type: 'NUMBER', precision: 10, scale: 2 },
      {
        title: 'Golfo kortų tipas',
        type: 'SELECT',
        options: [
          'Links course',
          'Parkland course',
          'Heathland course',
          'Sandbelt course',
          'Stadium/Championship course',
          'Par-3 course',
        ],
      },
      { title: 'Par', type: 'NUMBER' },
      { title: 'Golfo praktikavimosi erdvė', type: 'BOOLEAN' },
      { title: 'Nuvažiuojamas atstumas (metrais)', type: 'NUMBER' },
      { title: 'Practice green', type: 'NUMBER' },
      { title: 'Putting green', type: 'NUMBER' },
      { title: 'Bunker', type: 'NUMBER' },
      { title: 'Chipping', type: 'NUMBER' },
      { title: 'Posvyrio kampas tiesiojoje (Laipsniais)', type: 'NUMBER' },
      { title: 'Posvyrio kampas posūkyje (Laipsniais)', type: 'NUMBER' },
    ];

    for (const item of data) {
      await this.createEntity(null, item);
    }
  }
}
