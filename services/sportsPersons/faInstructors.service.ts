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
import { SN_SPORTSPERSONS, SN_SPORTSPERSONS_FAINSTRUCTORS } from '../../types/serviceNames';
import { SportsPerson } from './index.service';

interface Fields extends CommonFields {
  id: number;
  faSpecialists: Array<{
    faSpecialist: SportsPerson['id'];
    dateFrom: Date;
    dateTo: Date;
  }>;
}
interface Populates extends CommonPopulates {
  faSpecialists: OverrideArray<
    Fields['faSpecialists'],
    {
      faSpecialist: SportsPerson;
    }
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
      faSpecialists: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            faSpecialist: TYPE_ID_OR_OBJECT_WITH_ID,
            dateFrom: 'date',
            dateTo: 'date',
          },
        },
        populate: PopulateHandlerFn({
          faSpecialist: `${SN_SPORTSPERSONS}.resolve`,
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
