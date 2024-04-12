'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  ONLY_GET_REST_ENABLED,
  Table,
} from '../types';
import { SportBaseSpaceField } from './sportsBases.spaces.fields.service';
import { SportBaseSpaceType } from './sportsBases.spaces.types.service';

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
  name: 'sportsBases.spaces.typesAndFields',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpacesTypesAndFields',
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
      type: {
        type: 'number',
        columnName: 'typeId',
        immutable: true,
        optional: true,
        populate: 'sportsBases.spaces.types.resolve',
      },
      field: {
        type: 'number',
        columnName: 'fieldId',
        immutable: true,
        optional: true,
        populate: 'sportsBases.spaces.fields.resolve',
      },

      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ONLY_GET_REST_ENABLED,
})
export default class SportsBasesSpacesTypesAndFieldsService extends moleculer.Service {
  @Method
  async seedDB() {
    await this.broker.waitForServices(['sportsBases.spaces.types', 'sportsBases.spaces.fields']);
    const types: Array<SportBaseSpaceType> = await this.broker.call(
      'sportsBases.spaces.types.find',
    );
    const fields: Array<SportBaseSpaceField> = await this.broker.call(
      'sportsBases.spaces.fields.find',
    );

    const typesIds = types.reduce(
      (acc, item) => ({ ...acc, [item.name]: item.id }),
      {} as { [key: string]: number },
    );

    const fieldsIds = fields.reduce(
      (acc, item) => ({ ...acc, [item.title]: item.id }),
      {} as { [key: string]: number },
    );

    const data = [
      { type: 'Sporto salė', field: 'Plotas (m2)' },
      {
        type: 'Skvošo aikštelė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Aerobikos salė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Plotas (m2)',
      },
      {
        type: 'Teniso kortai',
        field: 'Plotas (m2)',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Plotas (m2)',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Plotas (m2)',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Plotas (m2)',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Plotas (m2)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Plotas (m2)',
      },
      { type: 'Čiuožykla', field: 'Plotas (m2)' },
      {
        type: 'Jojimo maniežas',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Plotas (m2)',
      },
      { type: 'Stadionas ', field: 'Plotas (m2)' },
      {
        type: 'Futbolo aikštė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko čiuožykla',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko ekstremalaus sporto aikštelė (Pump track)',
        field: 'Plotas (m2)',
      },
      {
        type: 'Kita lauko sporto aikštelė',
        field: 'Plotas (m2)',
      },
      { type: 'Sporto salė', field: 'Ilgis (m)' },
      {
        type: 'Skvošo aikštelė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Aerobikos salė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Ilgis (m)',
      },
      { type: 'Teniso kortai', field: 'Ilgis (m)' },
      {
        type: 'Futbolo maniežas',
        field: 'Ilgis (m)',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Ilgis (m)',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Ilgis (m)',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Ilgis (m)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Ilgis (m)',
      },
      { type: 'Čiuožykla', field: 'Ilgis (m)' },
      {
        type: 'Jojimo maniežas',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Ilgis (m)',
      },
      { type: 'Stadionas ', field: 'Ilgis (m)' },
      {
        type: 'Futbolo aikštė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lauko čiuožykla',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Ilgis (m)',
      },
      {
        type: 'Lauko ekstremalaus sporto aikštelė (Pump track)',
        field: 'Ilgis (m)',
      },
      {
        type: 'Kita lauko sporto aikštelė',
        field: 'Ilgis (m)',
      },
      { type: 'Sporto salė', field: 'Plotis (m)' },
      {
        type: 'Skvošo aikštelė',
        field: 'Plotis (m)',
      },
      {
        type: 'Aerobikos salė',
        field: 'Plotis (m)',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Plotis (m)',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Plotis (m)',
      },
      {
        type: 'Teniso kortai',
        field: 'Plotis (m)',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Plotis (m)',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Plotis (m)',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Plotis (m)',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Plotis (m)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Plotis (m)',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Plotis (m)',
      },
      { type: 'Čiuožykla', field: 'Plotis (m)' },
      {
        type: 'Jojimo maniežas',
        field: 'Plotis (m)',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Plotis (m)',
      },
      { type: 'Stadionas ', field: 'Plotis (m)' },
      {
        type: 'Futbolo aikštė',
        field: 'Plotis (m)',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Plotis (m)',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Plotis (m)',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Plotis (m)',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Plotis (m)',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Plotis (m)',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Plotis (m)',
      },
      {
        type: 'Lauko čiuožykla',
        field: 'Plotis (m)',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Plotis (m)',
      },
      {
        type: 'Lauko ekstremalaus sporto aikštelė (Pump track)',
        field: 'Plotis (m)',
      },
      {
        type: 'Kita lauko sporto aikštelė',
        field: 'Plotis (m)',
      },
      { type: 'Sporto salė', field: 'Aukštis (m)' },
      {
        type: 'Skvošo aikštelė',
        field: 'Aukštis (m)',
      },
      {
        type: 'Aerobikos salė',
        field: 'Aukštis (m)',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Aukštis (m)',
      },
      {
        type: 'Teniso kortai',
        field: 'Aukštis (m)',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Aukštis (m)',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Aukštis (m)',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Aukštis (m)',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Aukštis (m)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Aukštis (m)',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Aukštis (m)',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Aukštis (m)',
      },
      { type: 'Stadionas ', field: 'Aukštis (m)' },
      {
        type: 'Futbolo aikštė',
        field: 'Aukštis (m)',
      },
      {
        type: 'Sporto salė',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Teniso kortai',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Kartingų trasos',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Čiuožykla',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Hipodromas',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Stadionas ',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Dviračių trekas',
        field: 'Stacionarios žiūrovų vietos',
      },
      {
        type: 'Sporto salė',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Teniso kortai',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Kartingų trasos',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Čiuožykla',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Hipodromas',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Stadionas ',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Dviračių trekas',
        field: 'Kilnojamos žiūrovų vietos',
      },
      {
        type: 'Sporto salė',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Teniso kortai',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Kartingų trasos',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Hipodromas',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Stadionas ',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Dviračių trekas',
        field: 'Žiūrovų vietos (iš viso)',
      },
      {
        type: 'Sporto salė',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Skvošo aikštelė',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Aerobikos salė',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Teniso kortai',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Stadionas ',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Pritaikyta judėjimo negalią turintiems asmenims',
      },
      {
        type: 'Sporto salė',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Skvošo aikštelė',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Aerobikos salė',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Teniso kortai',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Stadionas ',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Pritaikyta regos negalią turintiems asmenims',
      },
      {
        type: 'Sporto salė',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Teniso kortai',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Čiuožykla',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Stadionas ',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Dviračių trekas',
        field: 'Elektroninės švieslentės',
      },
      {
        type: 'Sporto salė',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Teniso kortai',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Čiuožykla',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Stadionas ',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Dviračių trekas',
        field: 'Papildoma informacija apie el. švieslentes',
      },
      {
        type: 'Sporto salė',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Aerobikos salė',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Teniso kortai',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Čiuožykla',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Stadionas ',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Dviračių trekas',
        field: 'Stacionari  įgarsinimo sistema',
      },
      {
        type: 'Sporto salė',
        field: 'Keičiama grindų danga',
      },
      {
        type: 'Aerobikos salė',
        field: 'Keičiama grindų danga',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Keičiama grindų danga',
      },
      {
        type: 'Sporto salė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Skvošo aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Aerobikos salė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Teniso kortai',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Hipodromas',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Stadionas ',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Kita lauko sporto aikštelė',
        field: 'Grindų dangos specifika',
      },
      {
        type: 'Sporto salė',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Skvošo aikštelė',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Teniso kortai',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Stadionas ',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Apšviestumas (lx)',
      },
      {
        type: 'Sporto salė',
        field: 'Kilnojamos pertvaros',
      },
      {
        type: 'Aerobikos salė',
        field: 'Kilnojamos pertvaros',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Kilnojamos pertvaros',
      },
      {
        type: 'Teniso kortai',
        field: 'Kilnojamos pertvaros',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Kilnojamos pertvaros',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Kilnojamos pertvaros',
      },
      { type: 'Sporto salė', field: 'Danga' },
      { type: 'Skvošo aikštelė', field: 'Danga' },
      { type: 'Aerobikos salė', field: 'Danga' },
      { type: 'Treniruoklių salė', field: 'Danga' },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Danga',
      },
      { type: 'Teniso kortai', field: 'Danga' },
      { type: 'Futbolo maniežas', field: 'Danga' },
      {
        type: 'Kitos sporto salės',
        field: 'Danga',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Danga',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Danga',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Danga',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Danga',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Danga',
      },
      { type: 'Dviračių trekas', field: 'Danga' },
      {
        type: 'Sporto salė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Skvošo aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Aerobikos salė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Papildoma informacija',
      },
      {
        type: 'Teniso kortai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Papildoma informacija',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Papildoma informacija',
      },
      {
        type: 'Kitos sporto salės',
        field: 'Papildoma informacija',
      },
      {
        type: 'Pripučiamos konstrukcijos statinys',
        field: 'Papildoma informacija',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Vidaus šaudykla',
        field: 'Papildoma informacija',
      },
      {
        type: 'Stendinio šaudymo šaudykla',
        field: 'Papildoma informacija',
      },
      {
        type: 'Biatlono šaudykla',
        field: 'Papildoma informacija',
      },
      {
        type: 'Šaudymo iš lanko šaudykla',
        field: 'Papildoma informacija',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Kartingų trasos',
        field: 'Papildoma informacija',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Papildoma informacija',
      },
      {
        type: 'Slidinėjimo trasos',
        field: 'Papildoma informacija',
      },
      {
        type: 'Marina',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Disk golfo kortai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Wake parkas',
        field: 'Papildoma informacija',
      },
      {
        type: 'Petankės aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Laipiojimas uolomis',
        field: 'Papildoma informacija',
      },
      {
        type: 'Kitos erdvės',
        field: 'Papildoma informacija',
      },
      {
        type: 'Čiuožykla',
        field: 'Papildoma informacija',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Papildoma informacija',
      },
      {
        type: 'Hipodromas',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Žirginio sporto trasa',
        field: 'Papildoma informacija',
      },
      {
        type: 'Atletikos salė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Boulingo takai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Kitos vidaus sporto erdvės',
        field: 'Papildoma informacija',
      },
      {
        type: 'Vidaus laipiojimo uolomis ',
        field: 'Papildoma informacija',
      },
      {
        type: 'Pagalbinės patalpos',
        field: 'Papildoma informacija',
      },
      {
        type: 'Stadionas ',
        field: 'Papildoma informacija',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko čiuožykla',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Papildoma informacija',
      },
      {
        type: 'Lauko ekstremalaus sporto aikštelė (Pump track)',
        field: 'Papildoma informacija',
      },
      { type: 'Aerobikos salė', field: 'Turėklas' },
      {
        type: 'Aerobikos salė',
        field: 'Veidrodinė siena',
      },
      {
        type: 'Treniruoklių salė',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Riedučių ir dviračių rampos',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Disk golfo kortai',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Wake parkas',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Hipodromas',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Žirginio sporto trasa',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Stadionas ',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Lauko čiuožykla',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Lauko ekstremalaus sporto aikštelė (Pump track)',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Kita lauko sporto aikštelė',
        field: 'Įranga / Aparašymas',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Ovalo takelių ilgis',
      },
      {
        type: 'Stadionas ',
        field: 'Ovalo takelių ilgis',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Ovalo takelių skaičius',
      },
      {
        type: 'Stadionas ',
        field: 'Ovalo takelių skaičius',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Tiesiosios takelio ilgis',
      },
      {
        type: 'Stadionas ',
        field: 'Tiesiosios takelio ilgis',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Tiesiosios takelių skaičius',
      },
      {
        type: 'Stadionas ',
        field: 'Tiesiosios takelių skaičius',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Rutulio stūmimo sektorius',
      },
      {
        type: 'Stadionas ',
        field: 'Rutulio stūmimo sektorius',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Trišuolio erdvė',
      },
      {
        type: 'Stadionas ',
        field: 'Trišuolio erdvė',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Šuolio su kartimi erdvė',
      },
      {
        type: 'Stadionas ',
        field: 'Šuolio su kartimi erdvė',
      },
      {
        type: 'Lengvosios atletikos maniežas',
        field: 'Šuolio į aukštį erdvė',
      },
      {
        type: 'Stadionas ',
        field: 'Šuolio į aukštį erdvė',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Šaudymo iš lanko šaudykla',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Lauko žaidimų aikštė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Hipodromas',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Lauko jojimo bazė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Stadionas ',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Krepšinio aikštelė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Tinklinio aikštelė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Multifunkcinė aikštelė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Kita lauko aikštelė',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Lauko teniso kortai',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Lauko BMX lenktynių trasa',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Lauko ekstremalaus sporto aikštelė (Pump track)',
        field: 'Dirbtinis apšvietimas',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Futbolo aikštės ilgis',
      },
      {
        type: 'Stadionas ',
        field: 'Futbolo aikštės ilgis',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Futbolo aikštės ilgis',
      },
      {
        type: 'Futbolo maniežas',
        field: 'Futbolo aikštės plotis',
      },
      {
        type: 'Stadionas ',
        field: 'Futbolo aikštės plotis',
      },
      {
        type: 'Futbolo aikštė',
        field: 'Futbolo aikštės plotis',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Plaukimo takelių skaičius',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Minimalus gylis (m)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Maksimalus gylis (m)',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Laiko matavimo sistema',
      },
      {
        type: 'Vidaus baseinai',
        field: 'Papildoma informacija apie laiko matavimo įrangą',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Trasos ilgis',
      },
      {
        type: 'Kartingų trasos',
        field: 'Trasos ilgis',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Trasos ilgis',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Trasos plotis ',
      },
      {
        type: 'Kartingų trasos',
        field: 'Trasos plotis ',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Trasos plotis ',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Važiavimo kryptis',
      },
      {
        type: 'Kartingų trasos',
        field: 'Važiavimo kryptis',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Važiavimo kryptis',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Starto vietų skaičius',
      },
      {
        type: 'Kartingų trasos',
        field: 'Starto vietų skaičius',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Starto vietų skaičius',
      },
      {
        type: 'Automobilių ar motociklų žiedai',
        field: 'Aukščių skirtumas',
      },
      {
        type: 'Kartingų trasos',
        field: 'Aukščių skirtumas',
      },
      {
        type: 'Automobilių ar motociklų trasos',
        field: 'Aukščių skirtumas',
      },
      {
        type: 'Vidaus šaudykla',
        field: 'Maksimalus šaudyklos ilgis',
      },
      {
        type: 'Stendinio šaudymo šaudykla',
        field: 'Maksimalus šaudyklos ilgis',
      },
      {
        type: 'Biatlono šaudykla',
        field: 'Maksimalus šaudyklos ilgis',
      },
      {
        type: 'Šaudymo iš lanko šaudykla',
        field: 'Maksimalus šaudyklos ilgis',
      },
      {
        type: 'Vidaus šaudykla',
        field: 'Taikinių skaičius',
      },
      {
        type: 'Stendinio šaudymo šaudykla',
        field: 'Taikinių skaičius',
      },
      {
        type: 'Biatlono šaudykla',
        field: 'Taikinių skaičius',
      },
      {
        type: 'Šaudymo iš lanko šaudykla',
        field: 'Taikinių skaičius',
      },
      {
        type: 'Vidaus šaudykla',
        field: 'Elektroniniai taikiniai',
      },
      {
        type: 'Stendinio šaudymo šaudykla',
        field: 'Elektroniniai taikiniai',
      },
      {
        type: 'Biatlono šaudykla',
        field: 'Elektroniniai taikiniai',
      },
      {
        type: 'Šaudymo iš lanko šaudykla',
        field: 'Elektroniniai taikiniai',
      },
      {
        type: 'Vidaus šaudykla',
        field: 'Judantys taikiniai',
      },
      {
        type: 'Stendinio šaudymo šaudykla',
        field: 'Judantys taikiniai',
      },
      {
        type: 'Biatlono šaudykla',
        field: 'Judantys taikiniai',
      },
      {
        type: 'Šaudymo iš lanko šaudykla',
        field: 'Judantys taikiniai',
      },
      {
        type: 'Aerodromas',
        field: 'Pakilimo tako parametrai',
      },
      { type: 'Marina', field: 'Vandens telkinys' },
      {
        type: 'Wake parkas',
        field: 'Vandens telkinys',
      },
      {
        type: 'Marina',
        field: 'Prieplaukų skaičius',
      },
      {
        type: 'Marina',
        field: 'Maksimali grimzlė',
      },
      { type: 'Marina', field: 'Valtinė' },
      {
        type: 'Disk golfo kortai',
        field: 'Krepšių skaičius',
      },
      {
        type: 'Petankės aikštelė',
        field: 'Takelių skaičius',
      },
      {
        type: 'Boulingo takai',
        field: 'Takelių skaičius',
      },
      {
        type: 'Laipiojimas uolomis',
        field: 'Sienos plotis',
      },
      {
        type: 'Vidaus laipiojimo uolomis ',
        field: 'Sienos plotis',
      },
      {
        type: 'Laipiojimas uolomis',
        field: 'Sienos aukštis',
      },
      {
        type: 'Vidaus laipiojimo uolomis ',
        field: 'Sienos aukštis',
      },
      {
        type: 'Žirginio sporto trasa',
        field: 'Kliūtys',
      },
      {
        type: 'Jojimo maniežas',
        field: 'Ovalo ilgis',
      },
      { type: 'Hipodromas', field: 'Ovalo ilgis' },
      {
        type: 'Dviračių trekas',
        field: 'Ovalo ilgis',
      },
      { type: 'Hipodromas', field: 'Ovalo plotis' },
      {
        type: 'Dviračių trekas',
        field: 'Ovalo plotis',
      },
      {
        type: 'Hipodromas',
        field: 'Vidurio aikštės ilgis',
      },
      {
        type: 'Stadionas ',
        field: 'Vidurio aikštės ilgis',
      },
      {
        type: 'Dviračių trekas',
        field: 'Vidurio aikštės ilgis',
      },
      {
        type: 'Hipodromas',
        field: 'Vidurio aikštės plotis',
      },
      {
        type: 'Stadionas ',
        field: 'Vidurio aikštės plotis',
      },
      {
        type: 'Dviračių trekas',
        field: 'Vidurio aikštės plotis',
      },
      {
        type: 'Hipodromas',
        field: 'Vidurio aikštės danga',
      },
      {
        type: 'Stadionas ',
        field: 'Vidurio aikštės danga',
      },
      {
        type: 'Dviračių trekas',
        field: 'Vidurio aikštės danga',
      },
      {
        type: 'Paplūdimio tinklinio aikštelė',
        field: 'Smėlio gylis',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Holes',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Plotas (m2)',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Golfo kortų tipas',
      },
      { type: 'Lauko golfo kortai', field: 'Par' },
      {
        type: 'Lauko golfo kortai',
        field: 'Golfo praktikavimosi erdvė',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Nuvažiuojamas atstumas (metrais)',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Practice green',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Putting green',
      },
      {
        type: 'Lauko golfo kortai',
        field: 'Bunker',
      },
      {
        type: 'Dviračių trekas',
        field: 'Posvyrio kampas tiesiojoje (Laipsniais)',
      },
      {
        type: 'Dviračių trekas',
        field: 'Posvyrio kampas posūkyje (Laipsniais)',
      },
    ];

    for (const item of data) {
      this.createEntity(null, {
        type: typesIds[item.type],
        field: fieldsIds[item.field],
      });
    }
  }
}
