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
  Table,
} from '../../types';
import {
  SN_SPORTSPERSONS_REFEREES,
  SN_TYPES_CATEGORIES_COMPANIES,
  SN_TYPES_STUDIES_COMPANIES,
  SN_TYPES_STUDIES_PROGRAMS,
} from '../../types/serviceNames';
import { TypeCategoryCompany } from '../types/categories/companies.service';
import { TypeStudiesCompany } from '../types/studies/companies.service';
import { TypeStudiesProgram } from '../types/studies/programs.service';

enum StudiesType {
  LEARNING = 'LEARNING',
  STUDIES = 'STUDIES',
}

interface Fields extends CommonFields {
  id: number;
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
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: TYPE_ID_OR_OBJECT_WITH_ID,
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
      careerEndedAt: 'date',
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {}
