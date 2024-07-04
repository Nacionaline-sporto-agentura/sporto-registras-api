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
  TYPE_ID_OR_OBJECT_WITH_ID,
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_SPORTSBASES,
  SN_SPORTSPERSONS_COACHES,
  SN_TENANTS,
  SN_TENANTS_WORKRELATIONS,
  SN_TYPES_NATIONAL_TEAM_AGE_GROUP,
  SN_TYPES_NATIONAL_TEAM_GENDER,
  SN_TYPES_SPORTTYPES,
  SN_TYPES_STUDIES_COMPANIES,
  SN_TYPES_STUDIES_PROGRAMS,
} from '../../types/serviceNames';
import { SportsBase } from '../sportsBases/index.service';
import { Tenant } from '../tenants/index.service';
import { TypeNationalTeamAgeGroup } from '../types/nationalTeams/ageGroups.service';
import { TypeNationalTeamGender } from '../types/nationalTeams/genders.service';
import { SportType } from '../types/sportTypes/index.service';
import { TypeStudiesCompany } from '../types/studies/companies.service';
import { TypeStudiesProgram } from '../types/studies/programs.service';
import { TenantWorkRelations } from '../types/tenants/workRelations.service';

interface Fields extends CommonFields {
  id: number;
  sportsBases: number[];
  nationalTeams: {
    sportType: SportType['id'];
    ageGroup: TypeNationalTeamAgeGroup['id'];
    gender: TypeNationalTeamGender['id'];
    startAt: Date;
    endAt: Date;
  }[];
  bonuses: { date: Date; amount: number };
  workRelations: {
    organization: Tenant['id'];
    basis: TenantWorkRelations['id'];
    position: string;
    startAt: Date;
    endAt: Date;
  }[];
  competences: {
    company: Tenant['id'];
  }[];
  studies: {
    company: TypeStudiesCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }[];
}
interface Populates extends CommonPopulates {
  sportsBases: SportsBase[];
  nationalTeams: OverrideArray<
    Fields['nationalTeams'],
    { sportType: SportType; ageGroup: TypeNationalTeamAgeGroup; gender: TypeNationalTeamGender }
  >;
  workRelations: OverrideArray<
    Fields['workRelations'],
    { organization: Tenant; basis: TenantWorkRelations }
  >;
  competences: OverrideArray<Fields['competences'], { company: Tenant }>;
  studies: OverrideArray<
    Fields['studies'],
    { company: TypeStudiesCompany; program: TypeStudiesProgram }
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
      sportsBases: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      nationalTeams: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sportType: TYPE_ID_OR_OBJECT_WITH_ID,
            ageGroup: TYPE_ID_OR_OBJECT_WITH_ID,
            gender: TYPE_ID_OR_OBJECT_WITH_ID,
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          sportType: `${SN_TYPES_SPORTTYPES}.resolve`,
          ageGroup: `${SN_TYPES_NATIONAL_TEAM_AGE_GROUP}.resolve`,
          gender: `${SN_TYPES_NATIONAL_TEAM_GENDER}.resolve`,
        }),
      },
      bonuses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: 'date',
            amount: 'number',
          },
        },
      },
      workRelations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            organization: TYPE_ID_OR_OBJECT_WITH_ID,
            basis: TYPE_ID_OR_OBJECT_WITH_ID,
            position: 'string',
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          organization: `${SN_TENANTS}.resolve`,
          basis: `${SN_TENANTS_WORKRELATIONS}.resolve`,
        }),
      },
      competences: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: TYPE_ID_OR_OBJECT_WITH_ID,
            documentNumber: 'string',
            formCode: 'string',
            position: 'string',
            series: 'string',
            issuedAt: 'date',
            expiresAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TENANTS}.resolve`, // TODO: galimai bus kitaip??
        }),
      },
      studies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: TYPE_ID_OR_OBJECT_WITH_ID,
            program: TYPE_ID_OR_OBJECT_WITH_ID,
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_STUDIES_COMPANIES}.resolve`,
          program: `${SN_TYPES_STUDIES_PROGRAMS}.resolve`,
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
