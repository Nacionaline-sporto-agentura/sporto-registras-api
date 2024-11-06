'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import RequestMixin, { REQUEST_FIELDS } from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  TENANT_FIELD,
  TYPE_ID_OR_OBJECT_WITH_ID,
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_NATIONALTEAMS,
  SN_SPORTSPERSONS,
  SN_TYPES_NATIONAL_TEAM_AGE_GROUP,
  SN_TYPES_NATIONAL_TEAM_GENDER,
  SN_TYPES_SPORTTYPES,
} from '../../types/serviceNames';
import { VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE, tableName } from '../../utils';
import { RequestEntityTypes } from '../requests/index.service';
import { SportsPerson } from '../sportsPersons/index.service';
import { TypeNationalTeamAgeGroup } from '../types/nationalTeams/ageGroups.service';
import { TypeNationalTeamGender } from '../types/nationalTeams/genders.service';
import { SportType } from '../types/sportTypes/index.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  startAt: Date;
  endAt: Date;
  ageGroup: TypeNationalTeamAgeGroup['id'];
  gender: TypeNationalTeamGender['id'];
  sportType: SportType['id'];
  athletes: Array<SportsPerson['id']>;
  coaches: Array<SportsPerson['id']>;
}
interface Populates extends CommonPopulates {
  ageGroup: TypeNationalTeamAgeGroup;
  gender: TypeNationalTeamGender;
  sportType: SportType;
  athletes: Array<SportsPerson<'athlete'>>;
  coaches: Array<SportsPerson<'coach'>>;
}

export type NationalTeam<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_NATIONALTEAMS,
  mixins: [
    DbConnection({
      collection: tableName(SN_NATIONALTEAMS),
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
      name: 'string',
      startAt: { type: 'date', columnType: 'datetime', required: true },
      endAt: { type: 'date', columnType: 'datetime' },
      ageGroup: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnType: 'integer',
        columnName: 'ageGroupId',
        populate: `${SN_TYPES_NATIONAL_TEAM_AGE_GROUP}.resolve`,
      },
      gender: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnType: 'integer',
        columnName: 'genderId',
        populate: `${SN_TYPES_NATIONAL_TEAM_GENDER}.resolve`,
      },
      sportType: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnType: 'integer',
        columnName: 'sportTypeId',
        populate: `${SN_TYPES_SPORTTYPES}.resolve`,
      },
      athletes: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        populate: {
          action: `${SN_SPORTSPERSONS}.resolve`,
          params: {
            populate: ['athlete'],
            sort: '-createdAt',
          },
        },
      },
      coaches: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        populate: {
          action: `${SN_SPORTSPERSONS}.resolve`,
          params: {
            populate: ['coach'],
            sort: '-createdAt',
          },
        },
      },
      ...REQUEST_FIELDS(RequestEntityTypes.NATIONAL_TEAMS),
      ...TENANT_FIELD,
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES, ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.names],
    scopes: {
      ...COMMON_SCOPES,
      ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.scopes,
    },
  },
})
export default class extends moleculer.Service {
  @Action({
    rest: 'GET /:id/base',
    params: {
      id: 'number|convert',
    },
  })
  base(ctx: Context<{ id: SportsPerson['id'] }>) {
    return this.resolveEntities(ctx, {
      id: ctx.params.id,
      populate: ['lastRequest', 'ageGroup', 'gender', 'sportType', 'athletes', 'coaches'],
    });
  }
}
