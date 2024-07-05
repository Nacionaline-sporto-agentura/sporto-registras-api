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
  SN_SPORTSBASES_SPACES_GROUPS,
  SN_SPORTSBASES_SPACES_TYPES,
} from '../../../../types/serviceNames';
import { tableName, tmpRestFix } from '../../../../utils';
import { SportsBasesType } from '../types.service';
import { SportBaseSpaceGroup } from './groups.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  type: SportsBasesType['id'];
}

interface Populates extends CommonPopulates {}
export type SportBaseSpaceType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES_SPACES_TYPES,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSBASES_SPACES_TYPES),
    }),
  ],
  settings: {
    rest: tmpRestFix(SN_SPORTSBASES_SPACES_TYPES),
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      group: {
        type: 'number',
        columnName: 'sportBaseSpaceGroupId',
        populate: `${SN_SPORTSBASES_SPACES_GROUPS}.resolve`,
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
    await this.broker.waitForServices([SN_SPORTSBASES_SPACES_GROUPS]);

    const sportsBasesSpacesGroups: SportBaseSpaceGroup[] = await this.broker.call(
      `${SN_SPORTSBASES_SPACES_GROUPS}.find`,
    );

    const sportsBasesSpacesGroupsIds = sportsBasesSpacesGroups.reduce(
      (acc, item) => ({ ...acc, [item.name]: item.id }),
      {} as { [key: string]: number },
    );

    const data = [
      {
        name: 'Uždarų patalpų erdvės',
        children: [
          { name: 'Gimnastikos salė' },
          { name: 'Boulingo takai' },
          { name: 'Laipiojimo sporto erdvė' },
          { name: 'Lengvosios atletikos maniežas' },
          { name: 'Padelio aikštelė' },
          { name: 'Badmintono aikštelė' },
          { name: 'Riedučių ir dviračių rampos' },
          { name: 'Skvošo aikštelė' },
          { name: 'Sporto salė' },
          { name: 'Bokso salė su ringu' },
          { name: 'Sunkiosios atletikos salė' },
          { name: 'Teniso kortai' },
          { name: 'Treniruoklių salė' },
          { name: 'Vidaus Dviračių trekai' },
          { name: 'Kitos vidaus sporto erdvės' },
        ],
      },
      {
        name: 'Lauko aikštynai',
        children: [
          { name: 'Futbolo aikštelė' },
          { name: 'Beisbolo aikštė' },
          { name: 'Padelio aikštelė' },
          { name: 'Krepšinio aikštelė' },
          { name: 'Petankės aikštelė' },
          { name: 'Piklbolo aištelė' },
          { name: 'Žolės riedulio aikštelė' },
          { name: 'Badmintono aikštelė' },
          { name: 'Teniso kortai' },
          { name: 'Paplūdinio tinklinio aikštelė' },
          { name: 'Stadionas (Ne mažesnis nei 100 m x 64 m žaidimo aikštelės dydis)' },
          { name: 'Tinklinio aikštelė' },
          { name: 'Kita lauko aikštelė' },
          { name: 'Paplūdimio futbolo aikštelė' },
        ],
      },
      {
        name: 'Kitos lauko erdvės',
        children: [
          { name: 'Diskgolfo parkas' },
          { name: 'Golfo aikštynas' },
          { name: 'Irklavimo bazė' },
          { name: 'BMX lenktynių trasa' },
          { name: 'Dviračių trasa' },
          { name: 'Ekstremalaus sporto aikštelė ("Pump track")' },
          { name: 'Laipiojimo sporto erdvė' },
          { name: '„Wake“ parkas' },
          { name: 'Treniruokliai' },
          { name: 'Kita lauko erdvė' },
        ],
      },
      { name: 'Baseinai', children: [{ name: 'Vidaus baseinai' }] },
      {
        name: 'Šaudyklos',
        children: [
          { name: 'Biatlono šaudykla' },
          { name: 'Lauko šaudykla' },
          { name: 'Stendinio šaudymo šaudykla' },
          { name: 'Šaudymo iš lanko šaudykla' },
          { name: 'Vidaus šaudykla' },
          { name: 'Kita šaudykla' },
        ],
      },
      {
        name: 'Žiemos sporto erdvės',
        children: [
          { name: 'Vidaus čiuožykla' },
          { name: 'Lauko čiuožykla' },
          { name: 'Slidinėjimo trasa' },
          { name: 'Lauko kalnų slidinėjimo trasa' },
          { name: 'Uždarų patalpų kalnų slidinėjimo trasa' },
          { name: 'Kita žiemos sporto erdvė' },
        ],
      },
      {
        name: 'Techninio sporto erdvės',
        children: [
          { name: 'Aerodromas' },
          { name: 'Automobilių, motociklų, motorinių transporto priemonių trasa' },
          { name: 'Kartingų trasa' },
          { name: 'Prieplauka' },
        ],
      },
      {
        name: 'Žirgų sporto erdvės',
        children: [{ name: 'Hipodromas' }, { name: 'Jojimo maniežas' }],
      },
      {
        name: 'Pagalbinės patalpos',
        children: [{ name: 'Persirengimo patalpos' }, { name: 'Pagalbinės patalpos' }],
      },
      {
        name: 'Apgyvendinimo, maitinimo, konferencinės erdvės',
        children: [
          { name: 'Apgyvendinimo erdvė' },
          { name: 'Konferencinė erdvė' },
          { name: 'Maitinimo erdvė' },
          { name: 'Reabilitacijos erdvė' },
        ],
      },
    ];

    for (const item of data) {
      const group = sportsBasesSpacesGroupsIds[item.name];
      for (const child of item.children) {
        await this.createEntity(null, {
          name: child.name,
          group,
        });
      }
    }
  }
}
