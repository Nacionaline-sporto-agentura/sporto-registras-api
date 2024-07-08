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
  needSportType: boolean;
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
      needSportType: 'boolean',
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
          { needSportType: true, name: 'Gimnastikos salė' },
          { needSportType: true, name: 'Boulingo takai' },
          { needSportType: true, name: 'Laipiojimo sporto erdvė' },
          { needSportType: true, name: 'Lengvosios atletikos maniežas' },
          { needSportType: true, name: 'Padelio aikštelė' },
          { needSportType: true, name: 'Badmintono aikštelė' },
          { needSportType: true, name: 'Riedučių ir dviračių rampos' },
          { needSportType: true, name: 'Skvošo aikštelė' },
          { needSportType: true, name: 'Sporto salė' },
          { needSportType: true, name: 'Bokso salė su ringu' },
          { needSportType: true, name: 'Sunkiosios atletikos salė' },
          { needSportType: true, name: 'Teniso kortai' },
          { needSportType: false, name: 'Treniruoklių salė' },
          { needSportType: true, name: 'Vidaus Dviračių trekai' },
          { needSportType: true, name: 'Kitos vidaus sporto erdvės' },
        ],
      },
      {
        name: 'Lauko aikštynai',
        children: [
          { needSportType: true, name: 'Futbolo aikštelė' },
          { needSportType: true, name: 'Beisbolo aikštė' },
          { needSportType: true, name: 'Padelio aikštelė' },
          { needSportType: true, name: 'Krepšinio aikštelė' },
          { needSportType: true, name: 'Petankės aikštelė' },
          { needSportType: true, name: 'Piklbolo aištelė' },
          { needSportType: true, name: 'Žolės riedulio aikštelė' },
          { needSportType: true, name: 'Badmintono aikštelė' },
          { needSportType: true, name: 'Teniso kortai' },
          { needSportType: true, name: 'Paplūdinio tinklinio aikštelė' },
          {
            needSportType: true,
            name: 'Stadionas (Ne mažesnis nei 100 m x 64 m žaidimo aikštelės dydis)',
          },
          { needSportType: true, name: 'Tinklinio aikštelė' },
          { needSportType: true, name: 'Kita lauko aikštelė' },
          { needSportType: true, name: 'Paplūdimio futbolo aikštelė' },
        ],
      },
      {
        name: 'Kitos lauko erdvės',
        children: [
          { needSportType: true, name: 'Diskgolfo parkas' },
          { needSportType: true, name: 'Golfo aikštynas' },
          { needSportType: true, name: 'Irklavimo bazė' },
          { needSportType: true, name: 'BMX lenktynių trasa' },
          { needSportType: true, name: 'Dviračių trasa' },
          { needSportType: true, name: 'Ekstremalaus sporto aikštelė ("Pump track")' },
          { needSportType: true, name: 'Laipiojimo sporto erdvė' },
          { needSportType: true, name: '„Wake“ parkas' },
          { needSportType: false, name: 'Treniruokliai' },
          { needSportType: true, name: 'Kita lauko erdvė' },
        ],
      },
      { name: 'Baseinai', children: [{ needSportType: true, name: 'Vidaus baseinai' }] },
      {
        name: 'Šaudyklos',
        children: [
          { needSportType: true, name: 'Biatlono šaudykla' },
          { needSportType: true, name: 'Lauko šaudykla' },
          { needSportType: true, name: 'Stendinio šaudymo šaudykla' },
          { needSportType: true, name: 'Šaudymo iš lanko šaudykla' },
          { needSportType: true, name: 'Vidaus šaudykla' },
          { needSportType: true, name: 'Kita šaudykla' },
        ],
      },
      {
        name: 'Žiemos sporto erdvės',
        children: [
          { needSportType: true, name: 'Vidaus čiuožykla' },
          { needSportType: true, name: 'Lauko čiuožykla' },
          { needSportType: true, name: 'Slidinėjimo trasa' },
          { needSportType: true, name: 'Lauko kalnų slidinėjimo trasa' },
          { needSportType: true, name: 'Uždarų patalpų kalnų slidinėjimo trasa' },
          { needSportType: true, name: 'Kita žiemos sporto erdvė' },
        ],
      },
      {
        name: 'Techninio sporto erdvės',
        children: [
          { needSportType: true, name: 'Aerodromas' },
          {
            needSportType: true,
            name: 'Automobilių, motociklų, motorinių transporto priemonių trasa',
          },
          { needSportType: true, name: 'Kartingų trasa' },
          { needSportType: true, name: 'Prieplauka' },
        ],
      },
      {
        name: 'Žirgų sporto erdvės',
        children: [
          { needSportType: true, name: 'Hipodromas' },
          { needSportType: true, name: 'Jojimo maniežas' },
        ],
      },
      {
        name: 'Pagalbinės patalpos',
        children: [
          { needSportType: false, name: 'Persirengimo patalpos' },
          { needSportType: false, name: 'Pagalbinės patalpos' },
        ],
      },
      {
        name: 'Apgyvendinimo, maitinimo, konferencinės erdvės',
        children: [
          { needSportType: false, name: 'Apgyvendinimo erdvė' },
          { needSportType: false, name: 'Konferencinė erdvė' },
          { needSportType: false, name: 'Maitinimo erdvė' },
          { needSportType: false, name: 'Reabilitacijos erdvė' },
        ],
      },
    ];

    for (const item of data) {
      const group = sportsBasesSpacesGroupsIds[item.name];
      for (const child of item.children) {
        await this.createEntity(null, {
          name: child.name,
          needSportType: child.needSportType,
          group,
        });
      }
    }
  }
}
