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
  SN_SPORTSPERSONS_FAINSTRUCTORS,
  SN_TENANTS,
  SN_TENANTS_WORKRELATIONS,
  SN_TYPES_STUDIES_COMPANIES,
  SN_TYPES_STUDIES_PROGRAMS,
  SN_USERS,
} from '../../types/serviceNames';
import { SportsBase } from '../sportsBases/index.service';
import { Tenant } from '../tenants/index.service';
import { TypeStudiesCompany } from '../types/studies/companies.service';
import { TypeStudiesProgram } from '../types/studies/programs.service';
import { TenantWorkRelations } from '../types/tenants/workRelations.service';

interface Fields extends CommonFields {
  id: number;
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
        type: 'number',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      sportsBases: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      faSpecialists: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        populate: `${SN_USERS}.resolve`,
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
          company: `${SN_TENANTS}.resolve`,
        }),
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
