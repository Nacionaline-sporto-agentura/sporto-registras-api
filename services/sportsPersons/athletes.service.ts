'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../../mixins/database.mixin';

import RequestMixin from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  OverrideArray,
  Table,
} from '../../types';
import { tableName } from '../../utils';
import { SN_SPORTSPERSONS_COACHES, SportsPersonCoach } from './coaches.service';

interface Fields extends CommonFields {
  id: number;

  memberships: Array<{
    documentNumber: number;
    series: string;
    date: Date;
  }>;

  careerEndedAt: 'date';

  coaches: Array<{
    coach: SportsPersonCoach['id'];
    startAt: Date;
    endAt: Date;
  }>;
}
interface Populates extends CommonPopulates {
  coaches: OverrideArray<Fields['coaches'], { coach: SportsPersonCoach }>;
}

export type SportsPersonAthlete<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_SPORTSPERSONS_ATHLETES = 'sportsPersons.athletes';

@Service({
  name: SN_SPORTSPERSONS_ATHLETES,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSPERSONS_ATHLETES),
    }),
    RequestMixin,
  ],
  settings: {
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },

      memberships: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            documentNumber: 'number',
            series: 'string',
            date: 'date',
          },
        },
      },

      careerEndedAt: 'date',

      coaches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            coach: 'number',
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          coach: `${SN_SPORTSPERSONS_COACHES}.resolve`,
        }),
      },

      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {}
