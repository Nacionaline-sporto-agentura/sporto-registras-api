'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import RequestMixin from '../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../types';
import { TenantFundingSourceType } from './tenants.fundingSources.types.service';
import { Tenant } from './tenants.service';

interface Fields extends CommonFields {
  id: number;
  tenant: Tenant['id'];
  fundsAmount: number;
  description: string;
  appointedAt: Date;
  type: TenantFundingSourceType['id'];
}

interface Populates extends CommonPopulates {
  type: TenantFundingSourceType;
  tenant: Tenant;
}

export type TenantFundingSource<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'tenants.fundingSources',
  mixins: [
    DbConnection({
      collection: 'tenantFundingSources',
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
      type: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'tenantFundingSourceTypeId',
        required: true,
        populate: {
          action: 'tenants.fundingSources.types.resolve',
          params: {
            fields: 'id,name',
          },
        },
      },
      tenant: {
        type: 'number',
        columnName: 'tenantId',
        required: true,
        populate: 'tenants.resolve',
      },
      fundsAmount: 'number|required',
      description: 'string',
      appointedAt: {
        type: 'date',
        columnType: 'datetime',
      },
      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class TenantsFundingSourceService extends moleculer.Service {}
