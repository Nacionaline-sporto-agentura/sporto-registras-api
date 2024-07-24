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
import { SN_SPORTSBASES_SPACES_FIELDS } from '../../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../../utils';

export const FieldTypes = {
  SELECT: 'SELECT',
  TEXT_AREA: 'TEXT_AREA',
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
};

const FIELD_GROUPS = {
  1: 'ERDVES_ISMATAVIMAI',
  2: 'ZIUROVU_VIETOS',
  3: 'PRITAIKYMAS_ASMENIMS_SU_NEGALIA',
  4: 'DANGOS',
  5: 'YPATYBES',
  6: 'PAPILDOMI_SEKTORIAI',
  7: 'BASEINO_PARAMETRAI',
  8: 'TRASOS_PARAMETRAI',
  9: 'SAUDYKLOS_PARAMETRAI',
  10: 'PRIEPLAUKU_PARAMETRAI',
  11: 'PAPILDOMA_INFORMACIJA',
} as const;

interface Fields extends CommonFields {
  id: number;
  title: string;
  required: boolean;
  precision?: number;
  scale?: number;
  options: any[];
  type: keyof typeof FieldTypes;
  fieldGroup: (typeof FIELD_GROUPS)[keyof typeof FIELD_GROUPS];
}

interface Populates extends CommonPopulates {}

export type SportBaseSpaceField<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_SPACES_FIELDS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_SPACES_FIELDS),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_SPACES_FIELDS),
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      title: 'string',
      description: 'string',
      required: 'boolean',
      precision: 'number|optional',
      scale: 'number|optional',
      type: {
        type: 'string',
        enum: Object.values(FieldTypes),
        required: true,
      },
      fieldGroup: {
        type: 'string',
        enum: Object.values(FIELD_GROUPS),
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
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class extends moleculer.Service {
  @Method
  async seedDB() {
    const fields: Record<
      number,
      {
        field_group: keyof typeof FIELD_GROUPS;
        field_name: string;
        field_description: string;
        type: string;
        required: boolean;
        options?: string[];
        classifier_type?: string;
      }
    > = {
      // Erdvės išmatavimai
      1: {
        field_group: 1,
        field_name: 'Erdvės ilgis',
        field_description: 'Nurodomas erdvės ilgis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      2: {
        field_group: 1,
        field_name: 'Erdvės plotis',
        field_description: 'Nurodomas erdvės plotis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      3: {
        field_group: 1,
        field_name: 'Erdvės plotas',
        field_description: 'Nurodomas erdvės plotas kvadratiniais metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      4: {
        field_group: 1,
        field_name: 'Erdvės aukštis  iki žemiausios vietos',
        field_description: 'Nurodomas aukštis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      5: {
        field_group: 1,
        field_name: 'Žaidybinės aikštelės ilgis',
        field_description: 'Nurodomas ilgis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      6: {
        field_group: 1,
        field_name: 'Žaidybinės akštelės plotis',
        field_description: 'Nurodomas plotis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },

      // Žiūrovų vietos
      7: {
        field_group: 2,
        field_name: 'Stacionarios žiūrovų vietos',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      8: {
        field_group: 2,
        field_name: 'Kilnojamos žiūrovų vietos',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },

      // Pritaikymas žmonėms su negalia
      9: {
        field_group: 3,
        field_name: 'Patekimas pritaikytas asmenims su judėjimo negalią',
        type: 'BOOLEAN',
        field_description: '',
        required: true,
      },
      10: {
        field_group: 3,
        field_name: 'Patekimas pritaikytas regos negalią turintiems asmenims',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },

      // Dangos
      11: {
        field_group: 4,
        field_name: 'Nuolatinė danga',
        field_description: '',
        type: 'CLASSIFIER',
        options: ['Parketas', 'Dirbtinė danga', 'Kita'],
        classifier_type: 'Uždarų patalų erdvių stacionarių grindų dangų klasifikatorius',
        required: true,
      },
      12: {
        field_group: 4,
        field_name: 'Turimos kitos pakeičiamos dangos',
        field_description: '(Jeigu turi)',
        type: 'TEXTAREA',
        required: false,
      },
      13: {
        field_group: 4,
        field_name: 'Žaidybinės aikštės danga',
        field_description: '',
        type: 'CLASSIFIER',
        options: ['Parketas', 'Dirbtinė danga', 'Kita'],
        classifier_type: 'Lauko aikštės dangos klasifikatorius',
        required: true,
      },
      14: {
        field_group: 4,
        field_name: 'Trasos danga',
        field_description: '',
        type: 'TEXTAREA',
        required: true,
      }, // ????

      //Ypatybės
      15: {
        field_group: 5,
        field_name: 'Pripučiamas (nuimamas) kupolas',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      16: {
        field_group: 5,
        field_name: 'Kilnojamos pertvaros',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      17: {
        field_group: 5,
        field_name: 'Veidrodinė siena',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      18: {
        field_group: 5,
        field_name: 'Apšvietimas',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      19: {
        field_group: 5,
        field_name: 'Elektroninės švieslentės',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      20: {
        field_group: 5,
        field_name: 'Stacionari įgarsinimo sistema',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      21: {
        field_group: 5,
        field_name: 'Laiko matavimo sistema',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      22: {
        field_group: 5,
        field_name: 'Diskgolfo krepšių skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      23: {
        field_group: 5,
        field_name: 'Duobučių skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      24: {
        field_group: 5,
        field_name: 'PAR',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      25: {
        field_group: 5,
        field_name: 'Takų skaičius',
        field_description: 'Nurodomas boulingo takų skaičius',
        type: 'INTEGER',
        required: true,
      },
      26: {
        field_group: 5,
        field_name: 'Kliūtys',
        field_description: '',
        type: 'TEXTAREA',
        required: true,
      },
      27: {
        field_group: 5,
        field_name: 'Disciplinos',
        field_description:
          'Nurodoma kokios disciplinos gali būti erdvėje (konkūrai, dailusis jojimas, trikovės jojimas, ištvermės jojimas, važiavimas kinkiniais)',
        type: 'TEXTAREA',
        required: true,
      },
      28: {
        field_group: 5,
        field_name: 'Pakilimo tako parametrai',
        field_description: '',
        type: 'TEXTAREA',
        required: true,
      },

      // Papildomi sektoriai
      29: {
        field_group: 6,
        field_name: 'Rutulio stūmimo sektorius',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      30: {
        field_group: 6,
        field_name: 'Disko metimo sektorius',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      31: {
        field_group: 6,
        field_name: 'Kūjo metimo sektorius',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      32: {
        field_group: 6,
        field_name: 'Trišuolio, šuolio į tolį sektorius',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      33: {
        field_group: 6,
        field_name: 'Šuolio su kartimi sektorius',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      34: {
        field_group: 6,
        field_name: 'Šuolio į aukštį sektorius',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      35: {
        field_group: 6,
        field_name: 'Ovalo takelių skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      36: {
        field_group: 6,
        field_name: 'Ovalo takelių ilgis',
        field_description: '',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      37: {
        field_group: 6,
        field_name: 'Ar yra barjerinio bėgimo tiesioji (110 m)',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      38: {
        field_group: 6,
        field_name: 'Bėgimo takelio sprintui ilgis',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      39: {
        field_group: 6,
        field_name: 'Bėgimo takelių sprintui skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      66: {
        field_group: 6,
        field_name: 'Kliūties su vandeniu vieta',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },

      // Baseino parametrai
      40: {
        field_group: 7,
        field_name: 'Minimalus gylis',
        field_description: 'Nurodomas minimalus gylis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      41: {
        field_group: 7,
        field_name: 'Maksimalus gylis',
        field_description: 'Nurodomas maksimalus gylis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      42: {
        field_group: 7,
        field_name: 'Takelių ilgis',
        field_description: 'Nurodomas ilgis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      43: {
        field_group: 7,
        field_name: 'Plaukimo takelių skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      44: {
        field_group: 7,
        field_name: 'Plaukimo takelių plotis',
        field_description: 'Nurodomas takelių plotis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      65: {
        field_group: 7,
        field_name: 'Šuolių į vandenį tramplinas / platforma',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },

      // Trasos parametrai
      45: {
        field_group: 8,
        field_name: 'Trasos ilgis',
        field_description: 'Nurodomas trasos ilgis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      46: {
        field_group: 8,
        field_name: 'Minimalus trasos plotis',
        field_description: 'Nurodomas plotis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      47: {
        field_group: 8,
        field_name: 'Važiavimo kryptis',
        field_description: 'Nurodoma trasos važiavimo kryptis standartinėje trasos konfigūracijoje',
        type: 'CLASSIFIER',
        options: ['Pagal laikrodžio rodyklę', 'Prieš laikrodžio rodyklę'],
        classifier_type: 'Trasos krypties klasifikatorius',
        required: true,
      },
      48: {
        field_group: 8,
        field_name: 'Starto vietų skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      49: {
        field_group: 8,
        field_name: 'Aukščių skirtumas',
        field_description: 'Nurodomas aukščių skirtumas metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },

      // Šaudyklos parametrai
      50: {
        field_group: 9,
        field_name: 'Maksimalus šaudyklos ilgis',
        field_description: 'Nurodomas ilgis metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },
      51: {
        field_group: 9,
        field_name: 'Taikinių skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      52: {
        field_group: 9,
        field_name: 'Elektroniniai taikiniai',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      53: {
        field_group: 9,
        field_name: 'Judantys taikiniai',
        field_description: '',
        type: 'BOOLEAN',
        required: true,
      },
      54: {
        field_group: 9,
        field_name: 'Šaudyklos įrangos aprašymas',
        field_description: '',
        type: 'TEXTAREA',
        required: true,
      },

      // Prieplaukos parametrai
      55: {
        field_group: 10,
        field_name: 'Vandens telkinys',
        field_description: '',
        type: 'TEXTAREA',
        required: true,
      },
      56: {
        field_group: 10,
        field_name: 'Prieplaukų skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      57: {
        field_group: 10,
        field_name: 'Maksimali grimzlė',
        field_description: 'Nurodoma grimzlė metrais',
        type: 'DECIMAL(10,2)',
        required: true,
      },

      // Dušų skaičius
      58: {
        field_group: 11,
        field_name: 'Dušų skaičius',
        field_description: 'Nurodomas dušo galvučių skaičius',
        type: 'INTEGER',
        required: true,
      },

      // Persirengimo spintelių skaičius
      59: {
        field_group: 11,
        field_name: 'Persirengimo spintelių skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },

      // Apgyvendinimo vietų skaičius
      60: {
        field_group: 11,
        field_name: 'Apgyvendinimo vietų skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      61: {
        field_group: 11,
        field_name: 'Konferencijos erdvės vietų skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },
      62: {
        field_group: 11,
        field_name: 'Maitinimo vietų skaičius',
        field_description: '',
        type: 'INTEGER',
        required: true,
      },

      63: {
        field_group: 11,
        field_name: 'Paslaugos',
        field_description: '',
        type: 'TEXTAREA',
        required: true,
      },

      // Papildoma informacija
      64: {
        field_group: 11,
        field_name: 'Papildoma informacija',
        field_description: '',
        type: 'TEXTAREA',
        required: false,
      },
    };

    const typeMap = (source: string) => {
      switch (source) {
        case 'TEXTAREA':
          return FieldTypes.TEXT_AREA;

        case 'INTEGER':
        case 'DECIMAL':
          return FieldTypes.NUMBER;

        case 'BOOLEAN':
          return FieldTypes.BOOLEAN;

        case 'CLASSIFIER':
          return FieldTypes.SELECT;
      }
    };

    const data: any = Object.values(fields).map((field) => {
      let precision: number | undefined = undefined;
      let scale: number | undefined = undefined;
      let type: string = typeMap(field.type);

      const reg = /(\w+)\((\d+),(\d+)\)/;

      if (reg.test(field.type)) {
        const matches = field.type.match(reg);
        type = typeMap(matches[1]);
        precision = Number(matches[2]);
        scale = Number(matches[3]);
      }

      return {
        title: field.field_name,
        description: field.field_description,
        required: field.required,
        type,
        precision,
        scale,
        options: (field as any).options,
        fieldGroup: FIELD_GROUPS[field.field_group],
      };
    });

    await this.createEntities(null, data);
  }
}
