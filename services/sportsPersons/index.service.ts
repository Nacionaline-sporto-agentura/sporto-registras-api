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
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import { tableName } from '../../utils';
import { SN_SPORTSBASES, SportsBase } from '../sportsBases/index.service';
import { SN_TENANTS, Tenant } from '../tenants/index.service';
import { SN_TYPES_SPORTTYPES, SportType } from '../types/sportTypes/index.service';
import { SN_TYPES_STUDIES_COMPANIES, TypeStudiesCompany } from '../types/studies/companies.service';
import { SN_TYPES_STUDIES_PROGRAMS, TypeStudiesProgram } from '../types/studies/programs.service';
import {
  SN_TENANTS_WORKRELATIONS,
  TenantWorkRelations,
} from '../types/tenants/workRelations.service';

export enum StudiesType {
  LEARNING = 'LEARNING',
  STUDIES = 'STUDIES',
}

interface Fields extends CommonFields {
  id: number;
  firstName: string;
  lastName: string;
  personalCode: string;
  sportTypes: Array<SportType['id']>;
  nationality: string;
  education: Array<{
    type: StudiesType;
    company: TypeStudiesCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }>;
  workRelations: Array<{
    organization: Tenant['id'];
    basis: TenantWorkRelations['id'];
    startAt: Date;
    endAt: Date;
  }>;
  studies: Array<{
    type: StudiesType;
    company: TypeStudiesCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }>;
  sportsBases: Array<SportsBase['id']>;
}

interface Populates extends CommonPopulates {
  sportTypes: SportType[];
  education: OverrideArray<
    Fields['education'],
    { company: TypeStudiesCompany; program: TypeStudiesProgram }
  >;
  workRelations: OverrideArray<
    Fields['workRelations'],
    { organization: Tenant; basis: TenantWorkRelations }
  >;
  studies: OverrideArray<
    Fields['studies'],
    { company: TypeStudiesCompany; program: TypeStudiesProgram }
  >;
  sportsBases: SportsBase[];
}

export type SportsPerson<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_SPORTSPERSONS = 'sportsPersons';

@Service({
  name: SN_SPORTSPERSONS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSPERSONS),
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
      firstName: 'string',
      lastName: 'string',
      personalCode: 'string',
      sportTypes: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        columnType: 'json',
        required: true,
        populate: {
          action: `${SN_TYPES_SPORTTYPES}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },
      nationality: 'string',
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: Object.values(StudiesType),
            },
            company: 'number',
            program: 'number',
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_STUDIES_COMPANIES}.resolve`,
          program: `${SN_TYPES_STUDIES_PROGRAMS}.resolve`,
        }),
      },
      workRelations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            organization: 'number',
            basis: 'number',
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          organization: `${SN_TENANTS}.resolve`,
          basis: `${SN_TENANTS_WORKRELATIONS}.resolve`,
        }),
      },
      studies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: Object.values(StudiesType),
            },
            company: 'number',
            program: 'number',
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_STUDIES_COMPANIES}.resolve`,
          program: `${SN_TYPES_STUDIES_PROGRAMS}.resolve`,
        }),
      },
      sportsBases: {
        type: 'array',
        items: 'number',
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {}
