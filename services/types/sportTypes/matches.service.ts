'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../../types';
import { tableName } from '../../../utils';
import { SN_TYPES_SPORTTYPES, SportType } from './index.service';

export enum SportTypeMatchType {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
}

interface Fields extends CommonFields {
  id: number;
  sportType: SportType['id'];
  name: string;
  type: SportTypeMatchType;
  olympic?: boolean;
  paralympic?: boolean;
  deaf?: boolean;
  specialOlympics?: boolean;
}

interface Populates extends CommonPopulates {
  sportType: SportType;
}

export type SportTypeMatch<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_TYPES_SPORTTYPES_MATCHES = 'types.sportTypes.matches';

@Service({
  name: SN_TYPES_SPORTTYPES_MATCHES,
  mixins: [
    DbConnection({
      collection: tableName(SN_TYPES_SPORTTYPES_MATCHES),
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
      sportType: {
        columnName: 'sportTypeId',
        immutable: true,
        optional: true,
        populate: `${SN_TYPES_SPORTTYPES}.resolve`,
      },
      name: 'string',
      type: {
        type: 'string',
        enum: Object.values(SportTypeMatchType),
      },
      olympic: { type: 'boolean', default: false },
      paralympic: { type: 'boolean', default: false },
      deaf: { type: 'boolean', default: false },
      specialOlympics: { type: 'boolean', default: false },

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
    await this.broker.waitForServices([SN_TYPES_SPORTTYPES]);

    const gimnastika: SportType = await this.broker.call(`${SN_TYPES_SPORTTYPES}.findOne`, {
      query: { name: 'Gimnastika' },
    });

    if (gimnastika?.id) {
      const data: Array<Partial<SportTypeMatch>> = [
        {
          sportType: gimnastika.id,
          name: 'Sportinė gimnastika',
          type: SportTypeMatchType.INDIVIDUAL,
          olympic: true,
        },
        {
          sportType: gimnastika.id,
          name: 'Meninė gimnastika',
          type: SportTypeMatchType.INDIVIDUAL,
          olympic: true,
        },
        {
          sportType: gimnastika.id,
          name: 'Tramplinas',
          type: SportTypeMatchType.INDIVIDUAL,
          olympic: true,
        },
        {
          sportType: gimnastika.id,
          name: 'Akrobatinė gimnastika',
          type: SportTypeMatchType.INDIVIDUAL,
          olympic: false,
        },
        {
          sportType: gimnastika.id,
          name: 'Ritminė gimnastika',
          type: SportTypeMatchType.TEAM,
          olympic: false,
        },
      ];

      await this.createEntities(null, data);
    }
  }
}
