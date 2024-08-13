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
  SN_NATIONALTEAMS,
  SN_SPORTSPERSONS,
  SN_SPORTSPERSONS_COACHES,
  SN_TYPES_EDUCATIONAL_COMPANIES,
  SN_TYPES_QUALIFICATION_CATEGORIES,
} from '../../types/serviceNames';
import { Bonus } from '../bonuses/index.service';
import { NationalTeam } from '../nationalTeams/index.service';
import { EducationalCompany } from '../types/educationalCompanies.service';
import { QualificationCategory } from '../types/qualificationCategories.service';
import { SportsPerson } from './index.service';

interface Fields extends CommonFields {
  id: number;
  nationalTeams: Array<NationalTeam['id']>;
  bonuses: Array<Bonus['id']>;
  competences: Array<{
    company: EducationalCompany['id'];
    category: QualificationCategory['id'];
    issuedAt: Date;
    expiresAt: Date;
  }>;
}
interface Populates extends CommonPopulates {
  nationalTeams: Array<NationalTeam<'ageGroup' | 'gender' | 'sportType' | 'coaches' | 'athletes'>>;
  bonuses: Array<Bonus<'result'>>;
  competences: OverrideArray<
    Fields['competences'],
    {
      company: EducationalCompany;
      category: QualificationCategory;
    }
  >;
}

export type SportsPersonCoach<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSPERSONS_COACHES,
  mixins: [
    DbConnection({
      collection: 'sportsPersonsCoaches',
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
                condition: `coaches @> ?`,
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
            populate: ['results'],
            query: {
              sportsPerson: sportsPerson.id,
            },
          });
        },
      },

      competences: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: TYPE_ID_OR_OBJECT_WITH_ID,
            category: TYPE_ID_OR_OBJECT_WITH_ID,
            issuedAt: 'date',
            expiresAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_EDUCATIONAL_COMPANIES}.resolve`,
          category: `${SN_TYPES_QUALIFICATION_CATEGORIES}.resolve`,
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
      query: { coach: entityId },
    });
  }
}
