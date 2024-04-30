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
  Table,
} from '../types';
import { Tenant } from './tenants.service';

export enum MembershipTypes {
  LITHUANIAN = 'LITHUANIAN',
  INTERNATIONAL = 'INTERNATIONAL',
}

interface Fields extends CommonFields {
  id: number;
  tenant: Tenant['id'];
  improvements: string;
  type: MembershipTypes;
  name: string;
  companyCode: string;
  startAt: Date;
  endAt: Date;
}

interface Populates extends CommonPopulates {
  tenant: Tenant;
}

export type TenantMembership<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'tenants.memberships',
  mixins: [
    DbConnection({
      collection: 'tenantMemberships',
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
        type: 'string',
        enum: Object.values(MembershipTypes),
      },
      tenant: {
        type: 'number',
        columnName: 'tenantId',
        populate: 'tenants.resolve',
        required: true,
      },
      name: 'string|required',
      companyCode: 'string',
      startAt: {
        type: 'date',
        columnType: 'datetime',
        required: true,
      },
      endAt: {
        type: 'date',
        columnType: 'datetime',
        required: true,
      },
      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class TenantsMembershipsService extends moleculer.Service {}
