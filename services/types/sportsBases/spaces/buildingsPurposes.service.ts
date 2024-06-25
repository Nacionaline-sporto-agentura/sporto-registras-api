'use strict';
import moleculer, { Context } from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../../../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../../../types';
import { SN_SPORTSBASES_SPACES_BUILDINGPURPOSES } from '../../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../../utils';

interface Fields extends CommonFields {
  id: number;
  name: string;
  parent: number;
  children: number[];
}

interface SeedBuildingPurposes {
  name: string;
  children?: SeedBuildingPurposes[];
}

interface Populates extends CommonPopulates {
  parent: SportBaseSpaceBuildingPurpose;
  children: SportBaseSpaceBuildingPurpose[];
}
export type SportBaseSpaceBuildingPurpose<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_SPACES_BUILDINGPURPOSES,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_SPACES_BUILDINGPURPOSES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_SPACES_BUILDINGPURPOSES),
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      name: 'string',
      parent: {
        type: 'number',
        columnType: 'integer',
        columnName: 'parentId',
        populate: 'tenants.resolve',
      },
      children: {
        virtual: true,
        type: 'array',
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn(`${SN_SPORTSBASES_SPACES_BUILDINGPURPOSES}.populateByProp`),
          inheritPopulate: true,
          params: {
            sort: 'name',
            mappingMulti: true,
            queryKey: 'parent',
            populate: 'children',
          },
        },
      },
      ...COMMON_FIELDS,
    },
    scopes: {
      noParent(query: any, _: Context<null>, params: any) {
        if (!params?.id && !query?.parent) {
          query.parent = { $exists: false };
        }
        return query;
      },
      ...COMMON_SCOPES,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES, 'noParent'],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      {
        name: 'Gyvenamosios paskirties pastatai',
      },
      {
        name: 'Gyvenamoji (vieno buto pastatai)',
      },
      {
        name: ' Gyvenamoji (dviejų butų pastatai)',
      },
      {
        name: 'Gyvenamoji (trijų ir daugiau butų - daugiabučiai pastatai)',
      },
      {
        name: 'Gyvenamoji (įvairioms socialinėms grupėms)',
      },
      {
        name: 'Negyvenamosios paskirties pastatai',
      },
      {
        name: 'Viešbučių paskirties pastatai',
        children: [{ name: 'Viešbutis' }, { name: 'Motelis' }, { name: 'Svečių namai' }],
      },
      { name: 'Administracinė' },
      { name: 'Prekybos' },
      { name: 'Paslaugų' },
      { name: 'Maitinimo' },
      { name: 'Transporto' },
      { name: 'Garažų' },
      { name: 'Gamybos, pramonės' },
      { name: 'Sandėliavimo' },
      { name: 'Kultūros' },
      {
        name: 'Mokslo',
        children: [{ name: 'Bendrojo lavinimo mokyklų' }, { name: 'Ikimokyklinių ugdymo mokyklų' }],
      },
      { name: 'Gydymo' },
      {
        name: 'Poilsio',
        children: [
          { name: 'Turizmo centrai' },
          { name: 'Poilsio namai' },
          { name: 'Jaunimo nakvynės namai' },
          { name: 'Kempingų pastatai' },
          { name: 'Kaimo turizmo pastatai' },
          { name: 'Medžioklės nameliai' },
          {
            name: 'Kiti pastatai, atitinkantys poilsio (rekreacinių) pastatų apibrėžimą ir nepriskirti kitoms pastatų grupėms (pogrupiams)',
          },
        ],
      },
      { name: 'Sporto' },
      { name: 'Religinė' },
      { name: 'Specialioji' },
      {
        name: 'Pagalbinio ūkio paskirties',
        children: [
          { name: 'Sandėlis' },
          { name: 'Garažas (esantis namų valdoje)' },
          { name: 'Dirbtuvės' },
          { name: 'Pirtis (sauna)' },
          { name: 'Kieto kuro sandėlis (malkinė)' },
          { name: 'Vasaros virtuvė' },
          { name: 'Tvartas' },
          { name: 'Šiltnamis' },
          { name: 'Daržinė' },
          { name: 'Lauko tualetas' },
          { name: 'Pavėsinė (altana)' },
          { name: 'Kiti pastatai, skirti pagalbinio ūkio reikmėms' },
        ],
      },
      { name: 'Kita (fermų)' },
      {
        name: 'Kita (ūkio)',
        children: [
          { name: 'Daržinė' },
          { name: 'Svirnas' },
          { name: 'Garažas' },
          { name: 'Kiti pastatai, skirti žemės ūkio reikmėms' },
        ],
      },
      {
        name: 'Kita (šiltnamių)',
        children: [
          { name: 'Šiltnamis' },
          { name: 'Žiemos sodas (oranžerija)' },
          { name: 'Kiti pastatai, skirti augalams auginti' },
        ],
      },
      { name: 'Kita (sodų)' },
      { name: 'Kita' },
      { name: 'Susisiekimo komunikacijos' },
      { name: 'Vandens uostų' },
      { name: 'Oro uostų' },
      { name: 'Kitų transporto statinių' },
      {
        name: 'Kelių',
        children: [
          { name: 'Valstybinės reikšmės keliai' },
          { name: 'Magistraliniai keliai' },
          { name: 'Krašto keliai' },
          { name: 'Rajoniniai keliai' },
        ],
      },
      {
        name: 'Vietinės reikšmės keliai',
        children: [{ name: 'Vidaus keliai' }, { name: 'Viešieji keliai' }],
      },
      {
        name: 'Kelių (gatvių)',
      },
      {
        name: 'Geležinkelių',
        children: [
          { name: 'Viešojo (bendrojo) naudojimo geležinkeliai' },
          { name: 'Privažiuojamieji geležinkelio keliai' },
        ],
      },
      { name: 'Inžineriniai tinklai' },
      {
        name: 'Dujų tinklų',
        children: [
          { name: 'Magistraliniai dujotiekiai' },
          { name: 'Skirstomieji dujotiekiai' },
          { name: 'Tiesioginis vamzdynas' },
          { name: 'Vartotojo įvadai' },
          { name: 'Suskystintų naftos dujų sistema, kurią sudaro skirstomieji dujotiekiai' },
          { name: 'Gamtinių dujų saugyklos' },
          { name: 'Suskystintų gamtinių dujų įrenginiai' },
          { name: 'Kiti inžineriniai statiniai' },
        ],
      },
      {
        name: 'Vandentiekio tinklų',
        children: [
          { name: 'Magistraliniai tinklai (vandentakiai)' },
          { name: 'Skirstomieji tinklai' },
          { name: 'Įvadiniai tinklai' },
        ],
      },
      {
        name: 'Šilumos tinklų',
        children: [
          { name: 'Magistraliniai' },
          { name: 'Skirstomuosius' },
          { name: 'Pastatų įvadiniai tinklai' },
        ],
      },
      {
        name: 'Nuotekų šalinimo tinklų',
        children: [
          {
            name: 'Nuotekų surinkimo tinklai',
            children: [
              { name: 'Nuotekų kolektoriai' },
              { name: 'Nuotekų rinktuvai' },
              { name: 'Nuotekų išvadai' },
              { name: 'Nuotekų slėginiai tinklai' },
            ],
          },
        ],
      },
      { name: 'Naftos tinklų' },
      {
        name: 'Elektros tinklų',
        children: [
          { name: 'Perdavimo elektros tinklai' },
          { name: 'Skirstomieji elektros tinklai' },
          { name: 'Tiesioginė linija' },
        ],
      },
      { name: 'Ryšių (telekomunikacijų) tinklų' },
      { name: 'Kitų inžinerinių tinklų' },
      { name: 'Kita' },
      {
        name: 'Hidrotechnikos statiniai',
        children: [
          { name: 'Užtvankos' },
          { name: 'Dambos' },
          {
            name: 'Hidroelektrinių, hidroakumuliacinių elektrinių, siurblinių hidrotechnikos statiniai',
          },
          { name: 'Vandens pralaidos' },
          { name: 'Akvatorija' },
          {
            name: 'Vandenviečių statiniai ir nusodintuvai',
            children: [{ name: 'Vandenvietės statiniai' }, { name: 'Nusodintuvai' }],
          },
          { name: 'Kanalai' },
          { name: 'Krantosaugos statiniai' },
          { name: 'Žuvininkystės statiniai' },
          { name: 'Tvenkiniai' },
          { name: 'Laivininkystės statiniai' },
          { name: 'Jūros naftos ir dujų gavybos statiniai' },
          { name: 'Akvedukai' },
          { name: 'Bunos' },
          {
            name: 'Kiti hidrotechniniai statiniai vandens ištekliams naudoti ir aplinkai nuo žalingo vandens poveikio saugoti',
          },
          { name: 'Jūrų uostų infrastruktūra' },
          { name: 'Melioracijos statiniai' },
        ],
      },
      { name: 'Sporto paskirties inžineriniai statiniai' },
      { name: 'Kiti inžineriniai statiniai' },
    ];

    const seedBuildingsPurposes = async (items: SeedBuildingPurposes[], parent: number) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const category: SportBaseSpaceBuildingPurpose = await this.createEntity(null, {
          name: item.name,
          parent,
        });

        if (item.children) {
          seedBuildingsPurposes(item.children, category.id);
        }
      }
    };

    await seedBuildingsPurposes(data, null);
  }
}
