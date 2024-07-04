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
  FieldHookCallback,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  OverrideArray,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_COMPETITIONS_RESULTS,
  SN_SPORTSPERSONS,
  SN_SPORTSPERSONS_ATHLETES,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { SportsPersonCoach } from './coaches.service';
import { SportsPerson } from './index.service';

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

      competitionResults: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        async get({ ctx, entity }: FieldHookCallback) {
          if (!entity?.id) return 0;

          const sportsPerson: SportsPerson = await ctx.call(`${SN_SPORTSPERSONS}.findOne`, {
            query: { athlete: entity.id },
          });

          if (!sportsPerson?.id) return 0;

          return ctx.call(`${SN_COMPETITIONS_RESULTS}.find`, {
            populate: ['competition', 'sportType', 'match', 'sportsPersons', 'resultType'],
            query: {
              $raw: {
                condition: `sports_persons @> ?`,
                bindings: [sportsPerson.id],
              },
            },
          });
        },
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
            sportsPerson: TYPE_ID_OR_OBJECT_WITH_ID,
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          sportsPerson: `${SN_SPORTSPERSONS}.resolve`,
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
