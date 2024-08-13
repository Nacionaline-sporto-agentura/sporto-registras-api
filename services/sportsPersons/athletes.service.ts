'use strict';
import moleculer, { Context } from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
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
  SN_BONUSES,
  SN_COMPETITIONS_RESULTS,
  SN_NATIONALTEAMS,
  SN_RENTS,
  SN_SCHOLARSHIPS,
  SN_SPORTSPERSONS,
  SN_SPORTSPERSONS_ATHLETES,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { Bonus } from '../bonuses/index.service';
import { NationalTeam } from '../nationalTeams/index.service';
import { Rent } from '../rents/index.service';
import { Scholarship } from '../scholarships/index.service';
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
  nationalTeams: Array<NationalTeam['id']>;
  bonuses: Array<Bonus['id']>;
  scholarships: Array<Scholarship['id']>;
  rents: Array<Rent['id']>;
}
interface Populates extends CommonPopulates {
  coaches: OverrideArray<Fields['coaches'], { coach: SportsPersonCoach }>;
  nationalTeams: Array<NationalTeam<'ageGroup' | 'gender' | 'sportType' | 'coaches' | 'athletes'>>;
  bonuses: Array<Bonus<'result'>>;
  scholarships: Array<Scholarship<'result'>>;
  rents: Array<Rent<'result' | 'unit'>>;
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
          if (!entity?.id) return [];

          const sportsPerson: SportsPerson = await this.getSportsPerson(ctx, entity.id);
          if (!sportsPerson?.id) return [];

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

      bonuses: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        async get({ ctx, entity }: FieldHookCallback) {
          if (!entity?.id) return [];

          const sportsPerson: SportsPerson = await this.getSportsPerson(ctx, entity.id);
          if (!sportsPerson?.id) return [];

          return ctx.call(`${SN_BONUSES}.find`, {
            populate: ['result'],
            query: {
              sportsPerson: sportsPerson.id,
            },
          });
        },
      },

      scholarships: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        async get({ ctx, entity }: FieldHookCallback) {
          if (!entity?.id) return [];

          const sportsPerson: SportsPerson = await this.getSportsPerson(ctx, entity.id);
          if (!sportsPerson?.id) return [];

          return ctx.call(`${SN_SCHOLARSHIPS}.find`, {
            populate: ['result'],
            query: {
              sportsPerson: sportsPerson.id,
            },
          });
        },
      },

      rents: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        async get({ ctx, entity }: FieldHookCallback) {
          if (!entity?.id) return [];

          const sportsPerson: SportsPerson = await this.getSportsPerson(ctx, entity.id);
          if (!sportsPerson?.id) return [];

          return ctx.call(`${SN_RENTS}.find`, {
            populate: ['result', 'unit'],
            query: {
              sportsPerson: sportsPerson.id,
            },
          });
        },
      },

      nationalTeams: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        async get({ ctx, entity }: FieldHookCallback) {
          if (!entity?.id) return [];

          const sportsPerson: SportsPerson = await this.getSportsPerson(ctx, entity.id);
          if (!sportsPerson?.id) return [];

          return ctx.call(`${SN_NATIONALTEAMS}.find`, {
            populate: ['ageGroup', 'gender', 'sportType', 'athletes', 'coaches'],
            query: {
              $raw: {
                condition: `athletes @> ?`,
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
export default class extends moleculer.Service {
  @Method
  getSportsPerson(ctx: Context, entityId: unknown) {
    return ctx.call(`${SN_SPORTSPERSONS}.findOne`, {
      query: { athlete: entityId },
    });
  }
}
