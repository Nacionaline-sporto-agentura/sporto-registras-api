'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../../mixins/database.mixin';
import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
  TYPE_ID_OR_OBJECT_WITH_ID,
} from '../../types';
import {
  SN_COMPETITIONS_RESULTS,
  SN_SCHOLARSHIPS,
  SN_SPORTSPERSONS,
  SN_TYPES_SCHOLARSHIPS_REASONS,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { CompetitionResult } from '../competitions/results.service';
import { SportsPerson } from '../sportsPersons/index.service';

interface Fields extends CommonFields {
  id: number;
  sportPerson: SportsPerson['id'];
  result: CompetitionResult['id'];
  documentNumber: string;
  date: Date;
  amount: number;
  dateFrom: Date;
  dateTo: Date;
  data?: {
    from: Date;
    reason: string;
    renewFrom?: Date;
  };
  status: string;
}
interface Populates extends CommonPopulates {
  sportPerson: SportsPerson;
  result: CompetitionResult;
}

export type Scholarship<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

const ScholarshipType = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
};
@Service({
  name: SN_SCHOLARSHIPS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SCHOLARSHIPS),
    }),
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
        required: true,
        populate: `${SN_SPORTSPERSONS}.resolve`,
      },

      result: {
        columnName: 'resultId',
        required: true,
        populate: {
          action: `${SN_COMPETITIONS_RESULTS}.resolve`,
          params: {
            populate: ['competition', 'resultType'],
          },
        },
      },

      documentNumber: 'string|required',

      date: 'date|required',

      amount: 'number|required',

      dateFrom: 'date|required',

      dateTo: 'date|required',

      data: {
        type: 'object',
        properties: {
          from: 'date', // required: suspended or terminated
          reason: TYPE_ID_OR_OBJECT_WITH_ID, // required: suspended or terminated
          renewFrom: 'date', // required: suspended
        },
        populate: PopulateHandlerFn({
          reason: `${SN_TYPES_SCHOLARSHIPS_REASONS}.resolve`,
        }),
      },

      status: {
        type: 'enum',
        values: Object.values(ScholarshipType),
        default: ScholarshipType.ACTIVE,
      },

      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {}
