'use strict';

import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';

import DbConnection from '../../mixins/database.mixin';
import { COMMON_DEFAULT_SCOPES, COMMON_FIELDS, COMMON_SCOPES } from '../../types';
import { SN_REQUESTS_HISTORIES } from '../../types/serviceNames';

export const RequestHistoryTypes = {
  CREATED: 'CREATED',
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
  APPROVED: 'APPROVED',
  DELETED: 'DELETED',
};

@Service({
  name: SN_REQUESTS_HISTORIES,

  mixins: [
    DbConnection({
      collection: 'requestHistories',
      rest: false,
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
        type: 'string',
        enum: Object.values(RequestHistoryTypes),
      },

      request: {
        type: 'number',
        columnType: 'integer',
        columnName: 'requestId',
        required: true,
        immutable: true,
        populate: 'requests.resolve',
      },

      changes: {
        type: 'array',
        default: [],
      },

      comment: 'string',

      ...COMMON_FIELDS,
    },

    scopes: {
      ...COMMON_SCOPES,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
})
export default class extends moleculer.Service {}
