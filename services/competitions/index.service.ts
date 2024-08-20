'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
import filtersMixin from 'moleculer-knex-filters';
import DbConnection, { PopulateHandlerFn } from '../../mixins/database.mixin';
import RequestMixin, { REQUEST_FIELDS } from '../../mixins/request.mixin';
import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  TENANT_FIELD,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_COMPETITIONS,
  SN_COMPETITIONS_RESULTS,
  SN_TYPES_COMPETITIONS_TYPES,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { RequestEntityTypes } from '../requests/index.service';
import { CompetitionType } from '../types/competitions/types.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  year: string;
  competitionType: CompetitionType['id'];
  website: string;
  protocolDocument: any;
}
interface Populates extends CommonPopulates {
  competitionType: CompetitionType;
}

export type Competition<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_COMPETITIONS,
  mixins: [
    DbConnection({
      collection: tableName(SN_COMPETITIONS),
    }),
    RequestMixin,
    filtersMixin(),
  ],
  settings: {
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      name: 'string',
      year: {
        type: 'string',
        numeric: true,
        length: 4,
      },
      competitionType: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'competitionTypeId',
        populate: `${SN_TYPES_COMPETITIONS_TYPES}.resolve`,
      },
      website: 'string|required',
      protocolDocument: 'object|required',

      results: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn(`${SN_COMPETITIONS_RESULTS}.populateByProp`),
          params: {
            queryKey: 'competition',
            mappingMulti: true,
            populate: ['sportType', 'match', 'sportsPersons', 'resultType'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_COMPETITIONS_RESULTS,
          relationField: 'competition',
        },
      },
      ...REQUEST_FIELDS(RequestEntityTypes.COMPETITIONS),
      ...TENANT_FIELD,
      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: { ...ACTIONS_MUTATE_ADMIN_ONLY },
})
export default class extends moleculer.Service {
  @Action({
    rest: 'GET /:id/base',
    params: {
      id: 'number|convert',
    },
  })
  base(ctx: Context<{ id: Competition['id'] }>) {
    return this.resolveEntities(ctx, {
      id: ctx.params.id,
      populate: ['lastRequest', 'competitionType', 'results'],
    });
  }
}
