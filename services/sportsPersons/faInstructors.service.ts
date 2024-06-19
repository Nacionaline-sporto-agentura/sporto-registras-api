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
import { SN_SPORTSBASES, SportsBase } from '../sportsBases/index.service';
import { SN_TENANTS, Tenant } from '../tenants/index.service';
import { SN_TYPES_STUDIES_COMPANIES, TypeStudiesCompany } from '../types/studies/companies.service';
import { SN_TYPES_STUDIES_PROGRAMS, TypeStudiesProgram } from '../types/studies/programs.service';
import {
  SN_TENANTS_WORKRELATIONS,
  TenantWorkRelations,
} from '../types/tenants/workRelations.service';
import { SN_USERS } from '../users.service';
import { SN_SPORTSPERSONS, SportsPerson } from './index.service';

interface Fields extends CommonFields {
  id: number;
  sportsPerson: number;
  sportsBases: number[];
  faSpecialists: number[];
  competences: {
    company: Tenant['id'];
    documentNumber: string;
    formCode: string;
    position: string;
    series: string;
    issuedAt: Date;
    expiresAt: Date;
  }[];
  workRelations: {
    organization: Tenant['id'];
    basis: TenantWorkRelations['id'];
    position: string;
    startAt: Date;
    endAt: Date;
  }[];
  studies: {
    company: TypeStudiesCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }[];
}
interface Populates extends CommonPopulates {
  sportsPerson: SportsPerson;
  sportsBases: SportsBase[];

  competences: OverrideArray<Fields['competences'], { company: Tenant }>;
  workRelations: OverrideArray<
    Fields['workRelations'],
    { organization: Tenant; basis: TenantWorkRelations }
  >;
  studies: OverrideArray<
    Fields['studies'],
    { company: TypeStudiesCompany; program: TypeStudiesProgram }
  >;
}

export type SportsPersonFaInstructor<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_SPORTSPERSONS_FAINSTRUCTORS = 'sportsPersons.faInstructors';

@Service({
  name: SN_SPORTSPERSONS_FAINSTRUCTORS,
  mixins: [
    DbConnection({
      collection: 'sportsPersonsFaInstructors',
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
      sportsPerson: {
        columnName: 'sportsPersonId',
        immutable: true,
        optional: true,
        populate: `${SN_SPORTSPERSONS}.resolve`,
      },
      sportsBases: {
        type: 'array',
        items: 'number',
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      faSpecialists: {
        type: 'array',
        items: 'number',
        populate: `${SN_USERS}.resolve`,
      },
      competences: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: 'number|convert',
            documentNumber: 'string',
            formCode: 'string',
            position: 'string',
            series: 'string',
            issuedAt: 'date',
            expiresAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TENANTS}.resolve`,
        }),
      },
      workRelations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            organization: 'number|convert',
            basis: 'number|convert',
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
      studies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: 'number|convert',
            program: 'number|convert',
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
