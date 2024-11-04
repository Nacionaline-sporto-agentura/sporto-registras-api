'use strict';
import { snakeCase } from 'lodash';
import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
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
  SN_SPORTSPERSONS,
  SN_TYPES_SPORTTYPES,
  SN_TYPES_VIOLATIONS_DISQUALIFICATION_REASONS,
  SN_VIOLATIONS,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { CompetitionResult } from '../competitions/results.service';
import { SportsPerson } from '../sportsPersons/index.service';
import { SportType } from '../types/sportTypes/index.service';
import { DisqualificationReason } from '../types/violations/disqualificationReasons.service';

const ViolationType = {
  DOPING: 'DOPING',
  MANIPULATION: 'MANIPULATION',
};

const PenaltyType = {
  SUSPENSION: 'SUSPENSION',
  DISQUALIFICATION: 'DISQUALIFICATION',
};

interface Fields extends CommonFields {
  id: number;
  type: keyof typeof ViolationType;
  sportsPerson?: SportsPerson['id'];
  sportType?: SportType['id'];
  penaltyType?: keyof typeof PenaltyType;
  disqualificationReason?: DisqualificationReason['id'];
  dateFrom?: Date;
  dateTo?: Date;
  description: string;
  competitionResult?: CompetitionResult['id'];
  invalidateResult?: boolean;
}
interface Populates extends CommonPopulates {
  sportsPerson: SportsPerson;
  sportType?: SportType;
  competitionResult?: CompetitionResult;
  disqualificationReason?: DisqualificationReason;
}

export type Violation<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_VIOLATIONS,
  mixins: [
    DbConnection({
      collection: tableName(SN_VIOLATIONS),
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
      type: {
        type: 'enum',
        required: true,
        values: Object.values(ViolationType),
      },
      sportsPerson: {
        type: 'number',
        columnName: 'sportsPersonId',
        populate: `${SN_SPORTSPERSONS}.resolve`,
      },
      sportType: {
        type: 'number',
        columnName: 'sportTypeId',
        populate: `${SN_TYPES_SPORTTYPES}.resolve`,
      },
      penaltyType: {
        type: 'enum',
        values: Object.values(PenaltyType),
      },
      disqualificationReason: {
        type: 'number',
        columnName: 'disqualificationReasonId',
        populate: `${SN_TYPES_VIOLATIONS_DISQUALIFICATION_REASONS}.resolve`,
      },

      dateFrom: 'date',
      dateTo: 'date',
      description: 'string',
      competitionResult: {
        columnName: 'competitionResultId',
        populate: {
          action: `${SN_COMPETITIONS_RESULTS}.resolve`,
          params: {
            populate: ['competition', 'resultType'],
          },
        },
      },
      invalidateResult: 'boolean',
      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {
  @Action({
    params: {
      ids: {
        type: 'array',
        items: 'number|convert',
      },
    },
  })
  async bySportsPerson(ctx: Context<{ ids: number[] }>) {
    const { ids } = ctx.params;

    const adapter = await this.getAdapter(ctx);
    const knex = adapter.client;
    const table = adapter.getTable();

    const violationsTableName = tableName(SN_VIOLATIONS);
    const competitionsResultsTableName = tableName(SN_COMPETITIONS_RESULTS);
    const violationsBySportsPersonQuery = table
      .select(
        `${violationsTableName}.id`,
        knex.raw(`
          jsonb_array_elements(case
            when ${snakeCase(SN_VIOLATIONS)}."type" = 'DOPING'
            then to_jsonb(CONCAT('[',${snakeCase(SN_VIOLATIONS)}.sports_person_id,']')::jsonb)
            else ${snakeCase(competitionsResultsTableName)}.sports_persons
          end) as sports_person_id
        `),
      )
      .leftJoin(
        competitionsResultsTableName,
        knex.raw(
          `${snakeCase(SN_VIOLATIONS)}.competition_result_id = ${snakeCase(
            competitionsResultsTableName,
          )}.id and ${snakeCase(SN_VIOLATIONS)}.type = 'MANIPULATION'`,
        ),
      );

    const violationsBySportsPerson: any[] = await knex
      .select('*')
      .from(violationsBySportsPersonQuery.as('violationsBySportsPerson'))
      .whereIn('violationsBySportsPerson.sportsPersonId', ids);

    const violationIds = violationsBySportsPerson?.map((i) => i.id);

    const violations: Violation[] = await ctx.call(`${SN_VIOLATIONS}.resolve`, {
      id: violationIds,
    });

    return violations.reduce((acc: any, item) => {
      const relationships = violationsBySportsPerson.filter((i) => i.id === item.id);

      if (relationships?.length) {
        relationships.forEach((r) => {
          acc[r.sportsPersonId] ??= [];
          acc[r.sportsPersonId].push(item);
        });
      }

      return acc;
    }, {});
  }
}
