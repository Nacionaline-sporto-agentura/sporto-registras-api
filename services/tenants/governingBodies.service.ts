'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';

import RequestMixin from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  Table,
} from '../../types';
import { SN_TENANTS_GOVERNINGBODIES } from '../../types/serviceNames';
import { Tenant } from './index.service';

interface Fields extends CommonFields {
  id: number;
  tenant: Tenant['id'];
  name: string;
  users: {
    firstName: string;
    lastName: string;
    duties: string;
    personalCode: string;
  }[];
}

interface Populates extends CommonPopulates {
  tenant: Tenant;
}

export type TenantGoverningBody<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_TENANTS_GOVERNINGBODIES,
  mixins: [
    DbConnection({
      collection: 'tenantGoverningBodies',
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
      tenant: {
        type: 'number',
        columnName: 'tenantId',
        required: true,
        populate: 'tenants.resolve',
      },
      name: 'string|required',
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            firstName: 'string|required',
            lastName: 'string|required',
            duties: 'string|required',
            personalCode: {
              type: 'string',
              required: true,
              get: ({ value }: any) => {
                if (!value) return;
                //mask the last 4 digits
                return value.slice(0, -4).padEnd(value.length, '*');
              },
            },
          },
        },
        min: 1,
      },
      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {}
