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
import { tableName, tmpRestFix } from '../../../../utils';
import { SN_SPORTSBASES_TYPES, SportsBasesType } from '../types.service';

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

export const SN_SPORTSBASES_SPACES_TYPES = 'types.sportsBases.spaces.types';

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
      type: {
        type: 'number',
        columnName: 'sportBaseTypeId',
        populate: `${SN_SPORTSBASES_TYPES}.resolve`,
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
    await this.broker.waitForServices([SN_SPORTSBASES_TYPES]);

    const sportsBasesSpacesTypes: Array<SportsBasesType> = await this.broker.call(
      `${SN_SPORTSBASES_TYPES}.find`,
    );

    const sportsBasesSpacesTypesIds = sportsBasesSpacesTypes.reduce(
      (acc, item) => ({ ...acc, [item.name]: item.id }),
      {} as { [key: string]: number },
    );

    const data = [
      {
        name: 'Uždarų patalpų erdvės',
        children: [
          { name: 'Sporto salė' },
          { name: 'Skvošo aikštelė' },
          { name: 'Aerobikos salė' },
          { name: 'Treniruoklių salė' },
          { name: 'Lengvosios atletikos maniežas' },
          { name: 'Teniso kortai' },
          { name: 'Futbolo maniežas' },
          { name: 'Riedučių ir dviračių rampos' },
          { name: 'Kitos sporto salės' },
          { name: 'Pripučiamos konstrukcijos statinys' },
        ],
      },
      { name: 'Baseinai', children: [{ name: 'Vidaus baseinai' }] },
      {
        name: 'Šaudyklos',
        children: [
          { name: 'Vidaus šaudykla' },
          { name: 'Stendinio šaudymo šaudykla' },
          { name: 'Biatlono šaudykla' },
          { name: 'Šaudymo iš lanko šaudykla' },
        ],
      },
      {
        name: 'Auto / Moto sporto trasos',
        children: [
          { name: 'Automobilių ar motociklų žiedai' },
          { name: 'Kartingų trasos' },
          { name: 'Automobilių ar motociklų trasos' },
        ],
      },
      {
        name: 'Slidinėjimo trasos',
        children: [{ name: 'Slidinėjimo trasos' }],
      },
      {
        name: 'Kitos sporto šakų erdvės',
        children: [{ name: 'Aerodromas' }, { name: 'Marina' }],
      },
      {
        name: 'Kitos lauko sporto erdvės',
        children: [
          { name: 'Lauko žaidimų aikštė' },
          { name: 'Disk golfo kortai' },
          { name: 'Wake parkas' },
          { name: 'Petankės aikštelė' },
          { name: 'Laipiojimas uolomis' },
          { name: 'Kitos erdvės' },
        ],
      },
      { name: 'Ledo arenos', children: [{ name: 'Čiuožykla' }] },
      {
        name: 'Žirginis sportas',
        children: [
          { name: 'Jojimo maniežas' },
          { name: 'Hipodromas' },
          { name: 'Lauko jojimo bazė' },
          { name: 'Žirginio sporto trasa' },
        ],
      },
      {
        name: 'Kitos vidaus sporto erdvės',
        children: [
          { name: 'Atletikos salė' },
          { name: 'Boulingo takai' },
          { name: 'Kitos vidaus sporto erdvės' },
          { name: 'Vidaus laipiojimo uolomis ' },
        ],
      },
      {
        name: 'Pagalbinės patalpos',
        children: [{ name: 'Pagalbinės patalpos' }],
      },
      { name: 'Stadionas ', children: [{ name: 'Stadionas ' }] },
      {
        name: 'Lauko aikštynai',
        children: [
          { name: 'Futbolo aikštė' },
          { name: 'Krepšinio aikštelė' },
          { name: 'Tinklinio aikštelė' },
          { name: 'Paplūdimio tinklinio aikštelė' },
          { name: 'Multifunkcinė aikštelė' },
          { name: 'Kita lauko aikštelė' },
          { name: 'Lauko teniso kortai' },
          { name: 'Lauko golfo kortai' },
          { name: 'Lauko čiuožykla' },
          { name: 'Lauko BMX lenktynių trasa' },
          { name: 'Lauko ekstremalaus sporto aikštelė (Pump track)' },
          { name: 'Kita lauko sporto aikštelė' },
        ],
      },
      { name: 'Dviračių trekas', children: [{ name: 'Dviračių trekas' }] },
    ];

    for (const item of data) {
      const typeId = sportsBasesSpacesTypesIds[item.name];
      for (const child of item.children) {
        await this.createEntity(null, {
          name: child.name,
          type: typeId,
        });
      }
    }
  }
}
