'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  Table,
} from '../types';
import { SportsBasesLevel } from './sportsBases.levels.service';
import { SportsBasesCondition } from './sportsBases.technicalConditions.service';
import { SportsBasesType } from './sportsBases.types.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  type: SportsBasesType['id'];
  level: SportsBasesLevel['id'];
  technicalCondition: SportsBasesCondition['id'];
  address: string;
  coordinates: {
    x: number;
    y: number;
  };
  webPage: string;
  photos: Array<{
    url: string;
    description?: string;
    representative?: boolean;
    public?: boolean;
  }>;
  plotNumber: string;
  disabledAccessible: boolean;
  blindAccessible: boolean;
  plotArea: number;
  builtPlotArea: number;
  audienceSeats: number;
  parkingPlaces: number;
  dressingRooms: number;
  methodicalClasses: number;
  saunas: number;
  diningPlaces: number;
  accommodationPlaces: number;
  publicWifi: boolean;

  plans: Array<{
    url: string;
    name?: string;
    size?: number;
  }>;
}

interface Populates extends CommonPopulates {}

export type SportsBase<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases',
  mixins: [
    DbConnection({
      collection: 'sportsBases',
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
      name: 'string|required',
      type: {
        type: 'number',
        columnName: 'typeId',
        immutable: true,
        required: true,
        populate: 'sportsBases.types.resolve',
      },
      level: {
        type: 'number',
        columnName: 'levelId',
        immutable: true,
        required: true,
        populate: 'sportsBases.levels.resolve',
      },
      technicalCondition: {
        type: 'number',
        columnName: 'technicalConditionId',
        immutable: true,
        required: true,
        populate: 'sportsBases.technicalConditions.resolve',
      },

      address: 'string|required',
      coordinates: {
        type: 'object',
        properties: {
          x: 'number',
          y: 'number',
        },
        required: true,
      },
      webPage: 'string|required',
      photos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: 'string|required',
            description: 'string|required',
            representative: {
              type: 'boolean',
              required: false,
            },
            public: {
              type: 'boolean',
              required: false,
            },
          },
        },
        validate: 'validatePhotos',
        min: 1,
        required: true,
      },
      plotNumber: 'string|required',
      disabledAccessible: 'boolean|required', // for people with physical disability
      blindAccessible: 'boolean|required', // for blind people
      plotArea: 'number|required',
      builtPlotArea: 'number|required',
      audienceSeats: 'number|required',
      parkingPlaces: 'number|required',
      dressingRooms: 'number|required',
      methodicalClasses: 'number|required',
      saunas: 'number|required',
      diningPlaces: 'number|required',
      accommodationPlaces: 'number|required',
      publicWifi: 'boolean|required',

      plans: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: 'string|required',
            name: 'string',
            size: 'number',
          },
        },
        min: 1,
        required: true,
      },
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: {
    create: {
      rest: null,
    },
    update: {
      rest: null,
    },
    remove: {
      rest: null,
    },
  },
})
export default class SportsBasesService extends moleculer.Service {
  @Method
  async validatePhotos({ value, operation }: FieldHookCallback) {
    if (operation === 'create' || operation === 'update') {
      const representativeCount = value.filter(
        (photo: { representative?: boolean }) => photo.representative,
      ).length;
      if (representativeCount > 1) {
        return 'Only one photo can be representative';
      } else if (representativeCount === 0) {
        return 'Representative photo not specified';
      }
    }
    return true;
  }
}
