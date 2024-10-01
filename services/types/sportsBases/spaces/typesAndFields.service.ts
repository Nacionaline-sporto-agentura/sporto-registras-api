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
import {
  SN_SPORTSBASES_SPACES_FIELDS,
  SN_SPORTSBASES_SPACES_TYPES,
  SN_SPORTSBASES_SPACES_TYPESANDFIELDS,
} from '../../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../../utils';
import { SportBaseSpaceField } from './fields.service';
import { SportBaseSpaceType } from './types.service';

interface Fields extends CommonFields {
  id: number;
  type: SportBaseSpaceType;
  field: SportBaseSpaceField;
}

interface Populates extends CommonPopulates {}

export type SportBaseSpaceTypeAndField<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_SPACES_TYPESANDFIELDS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_SPACES_TYPESANDFIELDS),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_SPACES_TYPESANDFIELDS),
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      type: {
        type: 'number',
        columnName: 'sportBaseSpaceTypeId',
        immutable: true,
        optional: true,
        populate: `${SN_SPORTSBASES_SPACES_TYPES}.resolve`,
      },
      field: {
        type: 'number',
        columnName: 'sportBaseSpaceFieldId',
        immutable: true,
        optional: true,
        populate: `${SN_SPORTSBASES_SPACES_FIELDS}.resolve`,
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
    await this.broker.waitForServices([SN_SPORTSBASES_SPACES_TYPES, SN_SPORTSBASES_SPACES_FIELDS]);

    const types: Array<SportBaseSpaceType> = await this.broker.call(
      `${SN_SPORTSBASES_SPACES_TYPES}.find`,
    );
    const fields: Array<SportBaseSpaceField> = await this.broker.call(
      `${SN_SPORTSBASES_SPACES_FIELDS}.find`,
    );

    const typesIds = types.reduce(
      (acc, item) => ({ ...acc, [item.name]: item.id }),
      {} as { [key: string]: number },
    );

    const fieldsIds = fields.reduce(
      (acc, item) => ({ ...acc, [item.title]: item.id }),
      {} as { [key: string]: number },
    );

    const fieldsSource: any = {
      // Erdvės išmatavimai
      1: 'Erdvės ilgis',
      2: 'Erdvės plotis',
      3: 'Erdvės plotas',
      4: 'Erdvės aukštis  iki žemiausios vietos',
      5: 'Žaidybinės aikštelės ilgis',
      6: 'Žaidybinės akštelės plotis',

      // Žiūrovų vietos
      7: 'Stacionarios žiūrovų vietos',
      8: 'Kilnojamos žiūrovų vietos',

      // Pritaikymas žmonėms su negalia
      9: 'Patekimas pritaikytas asmenims su judėjimo negalią',
      10: 'Patekimas pritaikytas regos negalią turintiems asmenims',

      // Dangos
      11: 'Nuolatinė danga',
      12: 'Turimos kitos pakeičiamos dangos',
      13: 'Žaidybinės aikštės danga',
      14: 'Trasos danga',

      //Ypatybės
      15: 'Pripučiamas (nuimamas) kupolas',
      16: 'Kilnojamos pertvaros',
      17: 'Veidrodinė siena',
      18: 'Apšvietimas',
      19: 'Elektroninės švieslentės',
      20: 'Stacionari įgarsinimo sistema',
      21: 'Laiko matavimo sistema',
      22: 'Diskgolfo krepšių skaičius',
      23: 'Duobučių skaičius',
      24: 'PAR',
      25: 'Takų skaičius',
      26: 'Kliūtys',
      27: 'Disciplinos',
      28: 'Pakilimo tako parametrai',

      // Papildomi sektoriai
      29: 'Rutulio stūmimo sektorius',
      30: 'Disko metimo sektorius',
      31: 'Kūjo metimo sektorius',
      32: 'Trišuolio, šuolio į tolį sektorius',
      33: 'Šuolio su kartimi sektorius',
      34: 'Šuolio į aukštį sektorius',
      35: 'Ovalo takelių skaičius',
      36: 'Ovalo takelių ilgis',
      37: 'Ar yra barjerinio bėgimo tiesioji (110 m)',
      38: 'Bėgimo takelio sprintui ilgis',
      39: 'Bėgimo takelių sprintui skaičius',
      66: 'Kliūties su vandeniu vieta',

      // Baseino parametrai
      40: 'Minimalus gylis',
      41: 'Maksimalus gylis',
      42: 'Takelių ilgis',
      43: 'Plaukimo takelių skaičius',
      44: 'Plaukimo takelių plotis',
      65: 'Šuolių į vandenį tramplinas / platforma',

      // Trasos parametrai
      45: 'Trasos ilgis',
      46: 'Minimalus trasos plotis',
      47: 'Važiavimo kryptis',
      48: 'Starto vietų skaičius',
      49: 'Aukščių skirtumas',

      // Šaudyklos parametrai
      50: 'Maksimalus šaudyklos ilgis',
      51: 'Taikinių skaičius',
      52: 'Elektroniniai taikiniai',
      53: 'Judantys taikiniai',
      54: 'Šaudyklos įrangos aprašymas',

      // Prieplaukos parametrai
      55: 'Vandens telkinys',
      56: 'Prieplaukų skaičius',
      57: 'Maksimali grimzlė',

      // Dušų skaičius
      58: 'Dušų skaičius',

      // Persirengimo spintelių skaičius
      59: 'Persirengimo spintelių skaičius',

      // Apgyvendinimo vietų skaičius
      60: 'Apgyvendinimo vietų skaičius',
      61: 'Konferencijos erdvės vietų skaičius',
      62: 'Maitinimo vietų skaičius',

      63: 'Paslaugos',

      // Papildoma informacija
      64: 'Papildoma informacija',
    };

    const typesSource: any = {
      // Uždarų patalpų erdvės
      1: 'Gimnastikos salė',
      2: 'Boulingo takai',
      3: 'Laipiojimo sporto erdvė',
      4: 'Lengvosios atletikos maniežas',
      5: 'Padelio aikštelė',
      6: 'Badmintono aikštelė',
      7: 'Riedučių ir dviračių rampos',
      8: 'Skvošo aikštelė',
      9: 'Sporto salė',
      10: 'Bokso salė su ringu',
      11: 'Sunkiosios atletikos salė',
      12: 'Teniso kortai',
      13: 'Treniruoklių salė',
      14: 'Vidaus Dviračių trekai',
      15: 'Kitos vidaus sporto erdvės',

      // Lauko aikštynai
      16: 'Futbolo aikštelė',
      17: 'Beisbolo aikštė',
      18: 'Padelio aikštelė',
      19: 'Krepšinio aikštelė',
      20: 'Petankės aikštelė',
      21: 'Piklbolo aištelė',
      22: 'Žolės riedulio aikštelė',
      23: 'Badmintono aikštelė',
      24: 'Teniso kortai',
      25: 'Paplūdinio tinklinio aikštelė',
      64: 'Paplūdimio futbolo aikštelė',
      26: 'Stadionas (Ne mažesnis nei 100 m x 64 m žaidimo aikštelės dydis)',
      27: 'Tinklinio aikštelė',
      28: 'Kita lauko aikštelė',

      // Kitos lauko erdvės
      29: 'Diskgolfo parkas',
      30: 'Golfo aikštynas',
      31: 'Irklavimo bazė',
      32: 'BMX lenktynių trasa',
      33: 'Dviračių trasa',
      34: 'Ekstremalaus sporto aikštelė ("Pump track")',
      35: 'Laipiojimo sporto erdvė',
      36: '„Wake“ parkas',
      37: 'Treniruokliai',
      38: 'Kita lauko erdvė',

      // Baseinai
      39: 'Vidaus baseinai',

      // Šaudyklos
      40: 'Biatlono šaudykla',
      41: 'Lauko šaudykla',
      42: 'Stendinio šaudymo šaudykla',
      43: 'Šaudymo iš lanko šaudykla',
      44: 'Vidaus šaudykla',
      45: 'Kita šaudykla',

      //Žiemos sporto erdvės
      46: 'Vidaus čiuožykla',
      47: 'Lauko čiuožykla',
      48: 'Slidinėjimo trasa',
      49: 'Lauko kalnų slidinėjimo trasa',
      50: 'Uždarų patalpų kalnų slidinėjimo trasa',
      51: 'Kita žiemos sporto erdvė',

      //Techninio sporto erdvės
      52: 'Aerodromas',
      53: 'Automobilių, motociklų, motorinių transporto priemonių trasa',
      54: 'Kartingų trasa',
      55: 'Prieplauka',

      //Žirgų sporto erdvės
      56: 'Hipodromas',
      57: 'Jojimo maniežas',

      // Pagalbinės patalpos
      58: 'Persirengimo patalpos',
      59: 'Pagalbinės patalpos',

      //Apgyvendinimo, maitinimo, konferencinės erdvės
      60: 'Apgyvendinimo erdvė',
      61: 'Konferencinė erdvė',
      62: 'Maitinimo erdvė',
      63: 'Reabilitacijos erdvė',
    };

    const relationsSource: any = {
      // Uždarų patalpų erdvės

      1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 20, 64], // Gimnastikos sale
      2: [1, 2, 3, 7, 8, 9, 10, 19, 20, 25, 64], // Boulingo takai
      3: [1, 2, 3, 4, 7, 8, 9, 10, 19, 20, 21, 64], // Laipiojimo sporto erdve (vidaus)
      4: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 19, 20, 32, 33, 34, 38, 39, 64], // lengvosios atletikos maniezas
      5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 64], // Padelio aikstele
      6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 64], // Badmintono aikstele
      7: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 64], // Rieduciu ir dviraciu rampos
      8: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 64], // Skvoso aikstele
      9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 19, 20, 64], // Sporto sale
      10: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 20, 64], // Bokso sale su ringu
      11: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 64], // sunkiosios atletikos sale
      12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 64], // Teniso kortai
      13: [1, 2, 3, 4, 9, 10, 11, 12, 64], // Treniruokliu sale
      14: [1, 2, 3, 4, 7, 8, 9, 10, 14, 45, 64], // Vidaus dviraciu trekai
      15: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 64], // Kitos vidaus sporto erdves

      // Lauko aikštynai

      16: [
        1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 15, 18, 19, 20, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        66, 64,
      ], // Futbolo aikste
      17: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // Beisbolo aikste
      18: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // Lauko padelio aikstele
      19: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // Krepsinio aikstele
      20: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 20, 64], // Petankes aikstele
      21: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // Piklbolo aikstele
      22: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // Zoles riedulio aikstele
      23: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 20, 64], // Badmintono aikstele
      24: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // lauko teniso kortai
      25: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 64], // Papludimio tinklinio aikstele
      64: [1, 2, 3, 5, 6, 7, 8, 9, 10, 18, 19, 20, 64], // Papludimio futbolo aikstele
      26: [
        1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 15, 18, 19, 20, 21, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 66, 64,
      ], // Stadionas
      27: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 20, 64], // Tinklinio aikstele
      28: [
        1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 18, 19, 20, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 66,
        64,
      ], // Kita lauko aikstele

      // Kitos lauko erdvės

      29: [18, 22, 24, 64], // Diskolfo parkas
      30: [18, 23, 24, 64], // Golfo aikstynai
      31: [1, 2, 3, 7, 8, 9, 10, 18, 19, 20, 21, 55, 64], // Irklavimo baze
      32: [7, 8, 9, 10, 14, 18, 19, 20, 21, 45, 49, 64], // Lauko BMX lenktyniu trasa
      33: [7, 8, 9, 10, 14, 18, 19, 20, 21, 45, 49, 64], // Lauko dviraciu trasa
      34: [1, 2, 3, 7, 8, 9, 10, 14, 18, 19, 20, 21, 64], // pump track
      35: [1, 2, 3, 7, 8, 9, 10, 18, 19, 20, 21, 64], // laipiojimo sporto erdve (lauke)
      36: [7, 8, 9, 10, 18, 20, 64], // Wake parkas
      37: [1, 2, 3, 9, 10, 18, 64], // Lauko treniruokliai
      38: [1, 2, 3, 7, 8, 9, 10, 18, 19, 20, 21, 64], // Kita lauko erdve

      // Baseinai
      39: [1, 2, 3, 4, 7, 8, 9, 10, 19, 20, 21, 40, 41, 42, 43, 44, 65, 64], // Vidaus baseinas

      // Saudyklos

      40: [1, 2, 3, 9, 50, 51, 52, 54, 64], // biatlono saudykla
      41: [1, 2, 3, 9, 18, 50, 51, 52, 53, 54, 64], // lauko saudykla
      42: [1, 2, 3, 9, 50, 51, 52, 53, 54, 64], // stendinio saudymo saudykla
      43: [1, 2, 3, 9, 50, 51, 54, 64], // saudymo is lanko saudykla
      44: [1, 2, 3, 9, 50, 51, 52, 53, 54, 64], // vidaus saudykla
      45: [1, 2, 3, 9, 50, 51, 52, 53, 54, 64], // kita saudykla

      //Žiemos sporto erdvės
      46: [1, 2, 3, 7, 8, 9, 10, 19, 20, 64], // Vidaus ciuozykla
      47: [1, 2, 3, 7, 8, 9, 10, 18, 19, 20, 64], // Lauko ciuozykla
      48: [7, 8, 9, 10, 18, 20, 21, 45, 46, 49, 64], // Slidinejimo trasa
      49: [7, 8, 9, 10, 18, 21, 45, 49, 64], // Lauko kalnu slidinejimo trasa
      50: [1, 2, 3, 7, 8, 9, 10, 19, 20, 21, 45, 49, 64], // Uzdaru patalpu kalnu slidinejimo trasa
      51: [7, 8, 9, 10, 18, 19, 20, 21, 45, 46, 49, 64], // Kita ziemos sporto erdve

      //Technio sporto erdves
      52: [28, 64], //aerodromas
      53: [7, 8, 9, 10, 14, 18, 20, 21, 45, 46, 47, 48, 49, 64], // auto moto trasos
      54: [7, 8, 9, 10, 14, 18, 20, 21, 45, 46, 47, 48, 49, 64], // kartingu trasos
      55: [7, 8, 9, 10, 18, 20, 21, 55, 56, 57, 64], // Prieplaukos

      // zirgu sporto erdves
      56: [1, 2, 14, 18, 20, 45, 26, 27, 64], // hipodromas
      57: [1, 2, 4, 14, 15, 18, 20, 26, 27, 64], // jojimo maniezas

      // Pagalbines patalpos
      58: [1, 2, 3, 58, 59, 64], // persirengimo
      59: [1, 2, 3, 64], // pagalbines

      //Apgyvendinimo, maitinimo, konferencinės erdvės

      60: [60, 64], // apgyvendinimo
      61: [61, 64], // konferencijos
      62: [62, 64], // maitinimo
      63: [63, 64], // reabilitacijos
    };

    for (const typeIndex of Object.keys(relationsSource)) {
      const type = typesIds[typesSource[typeIndex]];

      for (const fieldIndex of relationsSource[typeIndex]) {
        const field = fieldsIds[fieldsSource[fieldIndex]];

        await this.createEntity(null, { type, field });
      }
    }
  }
}
