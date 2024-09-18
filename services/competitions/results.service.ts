'use strict';
import moleculer, { Context } from 'moleculer';
import { Event, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import RequestMixin from '../../mixins/request.mixin';
import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  EntityChangedParams,
  TYPE_ID_OR_OBJECT_WITH_ID,
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_COMPETITIONS,
  SN_COMPETITIONS_RESULTS,
  SN_SPORTSPERSONS,
  SN_TYPES_COMPETITIONS_RESULT_TYPES,
  SN_TYPES_SPORTTYPES,
  SN_TYPES_SPORTTYPES_MATCHES,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { SportsPerson } from '../sportsPersons/index.service';
import { ResultType } from '../types/competitions/resultTypes.service';
import { SportType } from '../types/sportTypes/index.service';
import { SportTypeMatch, SportTypeMatchType } from '../types/sportTypes/matches.service';
import { Competition } from './index.service';

interface Fields extends CommonFields {
  id: number;
  competition: Competition['id'];
  sportType: SportType['id'];
  match: SportTypeMatch['id'];
  selection: boolean;
  countriesCount: number;
  sportsPersons: Array<SportsPerson['id']>;
  resultType: ResultType['id'];
  result?: {
    value: number | { from: number; to: number };
  };
  participantsNumber: number;
}
interface Populates extends CommonPopulates {
  competition: Competition;
  sportType: SportType;
  match: SportTypeMatch;
  sportsPersons: SportsPerson[];
  resultType: ResultType;
}

export type CompetitionResult<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_COMPETITIONS_RESULTS,
  mixins: [
    DbConnection({
      collection: tableName(SN_COMPETITIONS_RESULTS),
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
      competition: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'competitionId',
        required: true,
        populate: `${SN_COMPETITIONS}.resolve`,
      },
      sportType: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportTypeId',
        required: true,
        populate: `${SN_TYPES_SPORTTYPES}.resolve`,
      },
      match: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'matchId',
        populate: `${SN_TYPES_SPORTTYPES_MATCHES}.resolve`,
      },
      otherMatch: 'string',
      matchType: {
        type: 'enum',
        values: Object.values(SportTypeMatchType),
      },
      selection: 'boolean',
      countriesCount: 'number|convert',
      sportsPersons: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        required: true,
        min: 1,
        populate: {
          action: `${SN_SPORTSPERSONS}.resolve`,
        },
      },
      resultType: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        required: true,
        columnName: 'resultTypeId',
        populate: `${SN_TYPES_COMPETITIONS_RESULT_TYPES}.resolve`,
      },
      result: {
        type: 'object',
        properties: {
          value: {
            type: 'multi',
            rules: [
              { type: 'number', convert: true },
              {
                type: 'object',
                properties: {
                  from: 'number|convert',
                  to: 'number|convert',
                },
              },
            ],
          },
        },
      },
      stages: 'number|integer|positive',
      participantsNumber: 'number|integer|positive',
      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {
  @Event()
  async 'competitions.removed'(ctx: Context<EntityChangedParams<Competition>>) {
    const competition = ctx.params.data as Competition;

    await this.removeEntities(ctx, {
      query: {
        competition: competition.id,
      },
    });
  }
}
