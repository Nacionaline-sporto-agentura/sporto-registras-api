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
import {
  SN_TYPES_CATEGORIES_COMPANIES,
  TypeCategoryCompany,
} from '../types/categories/companies.service';
import { SN_TYPES_STUDIES_COMPANIES, TypeStudiesCompany } from '../types/studies/companies.service';
import { SN_TYPES_STUDIES_PROGRAMS, TypeStudiesProgram } from '../types/studies/programs.service';
import { SN_SPORTSPERSONS, SportsPerson } from './index.service';

enum StudiesType {
  LEARNING = 'LEARNING',
  STUDIES = 'STUDIES',
}

interface Fields extends CommonFields {
  id: number;
  sportsPerson: number;
  categories: {
    company: TypeCategoryCompany['id'];
    documentNumber: string;
    formCode: string;
    series: string;
    issuedAt: Date;
  }[];
  studies: {
    type: StudiesType;
    company: TypeStudiesCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }[];
  careerEndedAt: Date;
}
interface Populates extends CommonPopulates {
  sportsPerson: SportsPerson;
  categories: OverrideArray<Fields['categories'], { company: TypeCategoryCompany }>;
  studies: OverrideArray<
    Fields['studies'],
    { company: TypeStudiesCompany; program: TypeStudiesProgram }
  >;
}

export type SportsPersonsReferees<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_SPORTSPERSONS_REFEREES = 'sportsPersons.referees';

@Service({
  name: SN_SPORTSPERSONS_REFEREES,
  mixins: [
    DbConnection({
      collection: 'sportsPersonsReferees',
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
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: 'number|convert',
            documentNumber: 'string',
            formCode: 'string',
            series: 'string',
            issuedAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_CATEGORIES_COMPANIES}.resolve`,
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
      careerEndedAt: 'date',
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {}
