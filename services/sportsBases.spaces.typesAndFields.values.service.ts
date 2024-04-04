'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  ONLY_GET_REST_ENABLED,
  Table,
} from '../types';

interface Fields extends CommonFields {
  id: number;
  typeAndField: number;
  sportBaseSpace: number;
  value: any;
}

interface Populates extends CommonPopulates {}

export type SportsBasesSpacesTypesAndFieldsValues<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;
@Service({
  name: 'sportsBases.spaces.typesAndFields.values',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpacesTypesAndFieldsValues',
      rest: false,
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
      typeAndField: {
        type: 'number',
        columnName: 'typeAndFieldId',
        immutable: true,
        optional: true,
        populate: 'sportsBasesSpaces.typesAndFields.resolve',
      },
      sportBaseSpace: {
        type: 'number',
        columnName: 'sportBaseSpaceId',
        immutable: true,
        optional: true,
        populate: 'sportsBasesSpaces.resolve',
      },
      value: 'any|required',
      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: {
    ...ONLY_GET_REST_ENABLED,
    get: {
      rest: null,
    },
    list: {
      rest: null,
    },
  },
})
export default class SportsBasesSpacesTypesSportsBasesSpacesFieldsValuesService extends moleculer.Service {}
