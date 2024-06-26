'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../../types';
import {
  SN_COMPETITIONS_RESULTS,
  SN_RENTS,
  SN_SPORTSPERSONS,
  SN_TYPES_RENTS_UNITS,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { CompetitionResult } from '../competitions/results.service';
import { SportsPerson } from '../sportsPersons/index.service';
import { TypeRentUnit } from '../types/rents/units.service';

interface Fields extends CommonFields {
  id: number;
  sportPerson: SportsPerson['id'];
  result: CompetitionResult['id'];
  documentNumber: string;
  date: Date;
  amount: number;
  unit: TypeRentUnit['id'];
  dateFrom: Date;
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
  unit: TypeRentUnit;
}

export type Rent<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

const RentStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
};

@Service({
  name: SN_RENTS,
  mixins: [
    DbConnection({
      collection: tableName(SN_RENTS),
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
        immutable: true,
        required: true,
        populate: `${SN_SPORTSPERSONS}.resolve`,
      },

      result: {
        columnName: 'resultId',
        required: true,
        populate: `${SN_COMPETITIONS_RESULTS}.resolve`,
      },

      documentNumber: 'string',

      date: 'date',

      amount: 'number',

      unit: {
        columnName: 'rentUnitId',
        required: true,
        populate: `${SN_TYPES_RENTS_UNITS}.resolve`,
      },

      dateFrom: 'date',

      data: {
        type: 'object',
        properties: {
          from: 'date', // required: suspended or terminated
          reason: 'string', // required: suspended or terminated
          renewFrom: 'date', // required: suspended
        },
      },

      status: {
        type: 'enum',
        values: Object.values(RentStatus),
        default: RentStatus.ACTIVE,
      },

      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class extends moleculer.Service {}
