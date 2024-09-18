'use strict';
import moleculer from 'moleculer';
import { Service } from 'moleculer-decorators';
import DbConnection, { MaterializedView } from '../../mixins/database.mixin';

import { ONLY_GET_REST_ENABLED, RestrictionType } from '../../types';

import PostgisMixin from 'moleculer-postgis';
import { SN_PUBLIC_SPORTS_BASES } from '../../types/serviceNames';
import { LKS_SRID } from '../tiles/sportsBases.service';

@Service({
  name: SN_PUBLIC_SPORTS_BASES,
  mixins: [
    DbConnection({
      collection: MaterializedView.SPORTS_BASES,
    }),
    PostgisMixin({
      srid: LKS_SRID,
      geojson: {
        maxDecimalDigits: 0,
      },
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
      email: 'string',
      phone: 'string',
      photos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: 'string',
            public: 'boolean',
            description: 'string',
            representative: 'boolean',
          },
        },
      },
      webPage: 'string',
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
      parkingPlaces: 'number',
      methodicalClasses: 'number',
      saunas: 'number',
      publicWifi: 'boolean',
      geom: {
        type: 'any',
        geom: true,
      },
      tenant: {
        type: 'object',
        properties: {
          id: 'number',
          name: 'string',
          phone: 'string',
          email: 'string',
          url: 'string',
        },
      },

      spaces: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: 'number',
            name: 'string',
            type: {
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
            additionalValues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'number',
                  name: 'string',
                  value: 'string',
                },
              },
            },
            constructionDate: 'string',
            technicalCondition: {
              type: 'object',
              properties: {
                id: 'number',
                name: 'string',
                color: 'string',
              },
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
      constructionDate: 'string',
      type: {
        type: 'object',
        properties: {
          id: 'number',
          name: 'string',
        },
      },
    },
  },
  actions: { ...ONLY_GET_REST_ENABLED },
})
export default class extends moleculer.Service {}
