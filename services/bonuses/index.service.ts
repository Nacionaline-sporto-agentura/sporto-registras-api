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
import { SN_BONUSES, SN_COMPETITIONS_RESULTS, SN_SPORTSPERSONS } from '../../types/serviceNames';
import { CompetitionResult } from '../competitions/results.service';
import { SportsPerson } from '../sportsPersons/index.service';

interface Fields extends CommonFields {
  id: number;
  sportPerson: SportsPerson['id'];
  result: CompetitionResult['id'];
  documentNumber: string;
  date: Date;
  amount: number;
  type: string;
}
interface Populates extends CommonPopulates {
  sportPerson: SportsPerson;
  result: CompetitionResult;
}

export type Bonus<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

const BonusType = {
  NATIONAL: 'NATIONAL',
  MUNICIPAL: 'MUNICIPAL',
};
@Service({
  name: SN_BONUSES,
  mixins: [
    DbConnection({
      collection: 'bonuses',
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

      type: {
        type: 'enum',
        values: Object.values(BonusType),
        default: BonusType.NATIONAL,
      },

      documentNumber: 'string',

      date: 'date',

      amount: 'number',

      result: {
        columnName: 'resultId',
        immutable: true,
        required: true,
        params: {
          populate: ['resultType', 'competition'],
        },
        populate: `${SN_COMPETITIONS_RESULTS}.resolve`,
      },

      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class extends moleculer.Service {}
