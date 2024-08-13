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
  SN_TYPES_EDUCATIONAL_COMPANIES,
} from '../../types/serviceNames';
import { EducationalCompany } from '../types/educationalCompanies.service';

enum StudiesType {
  LEARNING = 'LEARNING',
  STUDIES = 'STUDIES',
}

interface Fields extends CommonFields {
  id: number;
  categories: Array<{
    company: EducationalCompany['id'];
    documentNumber: string;
    formCode: string;
    series: string;
    issuedAt: Date;
  }>;
  careerEndedAt: Date;
}
interface Populates extends CommonPopulates {
  categories: OverrideArray<Fields['categories'], { company: EducationalCompany }>;
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
          company: `${SN_TYPES_EDUCATIONAL_COMPANIES}.resolve`,
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
