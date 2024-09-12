'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';

import { COMMON_FIELDS, ONLY_GET_REST_ENABLED, RestrictionType } from '../../types';

import { SN_PUBLIC_ORGANIZATIONS } from '../../types/serviceNames';

@Service({
  name: SN_PUBLIC_ORGANIZATIONS,
  mixins: [
    DbConnection({
      collection: 'publishing.organizations',
    }),
  ],
  settings: {
    auth: RestrictionType.PUBLIC,
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      name: 'string',
      code: 'string',
      address: 'string',
      email: 'string',
      phone: 'string',
      url: 'string',
      hasBeneficiaryStatus: 'boolean',
      nonGovernmentalOrganization: 'boolean',
      nonFormalEducation: 'boolean',
      lastRequestDate: 'date',

      type: {
        type: 'object',
        properties: {
          id: 'number',
          name: 'string',
        },
      },

      legalForm: {
        type: 'object',
        properties: {
          id: 'number',
          name: 'string',
        },
      },
      sportTypes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: 'number',
            name: 'string',
          },
        },
      },
      sportsBases: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: 'number',
            name: 'string',
            address: {
              type: 'object',
              properties: {
                municipality: {
                  type: 'object',
                  properties: {
                    code: 'number',
                    name: 'string',
                  },
                },
                city: {
                  type: 'object',
                  properties: {
                    code: 'number',
                    name: 'string',
                  },
                },
                street: {
                  type: 'object',
                  properties: {
                    code: 'number',
                    name: 'string',
                  },
                },
                house: {
                  type: 'object',
                  properties: {
                    code: 'number',
                    plot_or_building_number: 'string',
                  },
                },
                apartment: {
                  type: 'object',
                  properties: {
                    code: 'number',
                    room_number: 'string',
                  },
                },
              },
            },
            sportTypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'number',
                  name: 'string',
                },
              },
            },
          },
        },
      },
      ...COMMON_FIELDS,
    },
  },
  actions: { ...ONLY_GET_REST_ENABLED },
})
export default class extends moleculer.Service {}
