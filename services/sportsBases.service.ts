'use strict';
import { faker } from '@faker-js/faker';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../mixins/database.mixin';

import RequestMixin from '../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  ONLY_GET_REST_ENABLED,
  TENANT_FIELD,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../types';

import { VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE } from '../utils';
import { UserAuthMeta } from './api.service';
import { RequestEntityTypes, RequestStatus } from './requests.service';
import { SportsBasesBuildingType } from './sportsBases.buildingTypes.service';
import { SportBaseInvestment } from './sportsBases.investments.service';
import { SportBaseInvestmentSource } from './sportsBases.investments.sources.service';
import { SportsBasesLevel } from './sportsBases.levels.service';
import { SportsBaseOwner } from './sportsBases.owners.service';
import { SportBaseSpace } from './sportsBases.spaces.service';
import { SportBaseSpaceSportType } from './sportsBases.spaces.sportTypes.service';
import { SportBaseSpaceType } from './sportsBases.spaces.types.service';
import SportsBasesTechnicalConditionsService, {
  SportsBasesTechicalCondition,
} from './sportsBases.technicalConditions.service';
import { SportsBaseTenant } from './sportsBases.tenants.service';
import { SportsBasesType } from './sportsBases.types.service';
import { Tenant } from './tenants.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  type: SportsBasesType['id'];
  level: SportsBasesLevel['id'];
  technicalCondition: SportsBasesTechicalCondition['id'];
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
  spaces: undefined;
  investments: undefined;
  owners: undefined;
  tenants: undefined;
  tenant: Tenant['id'];
  lastRequest: undefined;
}

interface Populates extends CommonPopulates {
  spaces: SportBaseSpace<'technicalCondition' | 'type' | 'sportTypes' | 'buildingType'>[];
  lastRequest: Request;
  investments: SportBaseInvestment<'source'>[];
  owners: SportsBaseOwner<'user' | 'tenant'>[];
  tenants: SportsBaseTenant<'tenant'>[];
  tenant: Tenant;
}

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
      name: 'string|required',
      type: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'typeId',
        immutable: true,
        required: true,
        populate: 'sportsBases.types.resolve',
      },
      level: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'levelId',
        immutable: true,
        required: true,
        populate: 'sportsBases.levels.resolve',
      },
      technicalCondition: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
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
        min: 0,
        default: [],
      },

      spaces: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('sportsBases.spaces.populateByProp'),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['technicalCondition', 'type', 'sportTypes', 'buildingType'],
            sort: 'name',
          },
        },
        requestHandler: {
          service: 'sportsBases.spaces',
          relationField: 'sportBase',
        },
      },

      investments: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('sportsBases.investments.populateByProp'),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['source'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: 'sportsBases.investments',
          relationField: 'sportBase',
        },
      },

      owners: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('sportsBases.owners.populateByProp'),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['user', 'tenant'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: 'sportsBases.owners',
          relationField: 'sportBase',
        },
      },

      tenants: {
        type: 'array',
        items: { type: 'object' },
        virtual: true,
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('sportsBases.tenants.populateByProp'),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['tenant'],
            sort: '-createdAt',
          },
        },
      },

      lastRequest: {
        virtual: true,
        type: 'object',
        readonly: true,
        populate: {
          keyField: 'id',
          handler: PopulateHandlerFn('requests.populateByProp'),
          params: {
            queryKey: 'entity',
            query: {
              entityType: RequestEntityTypes.SPORTS_BASES,
            },
            mappingMulti: false,
            sort: '-createdAt',
          },
        },
      },

      canCreateRequest: {
        virtual: true,
        type: 'boolean',
        populate: {
          keyField: 'id',
          async handler(
            ctx: Context<{ populate: string | string[] }, UserAuthMeta>,
            values: any[],
            docs: any[],
          ) {
            const params = {
              id: values,
              sort: '-createdAt',
              queryKey: 'entity',
              mapping: true,
              mappingMulti: false,
            };
            const byKey: any = await ctx.call('requests.populateByProp', params);
            const { user, profile } = ctx?.meta;

            return docs?.map((d) => {
              const fieldValue = d.id;
              if (!fieldValue) return false;
              const request = byKey[fieldValue];

              const { tenant } = request;
              const isCreatedByUser = !tenant && user?.id === request.createdBy;
              const isCreatedByTenant = profile?.id === tenant;

              if (!isCreatedByTenant && !isCreatedByUser) return false;

              return [RequestStatus.APPROVED, RequestStatus.REJECTED].includes(request.status);
            });
          },
        },
      },
      ...TENANT_FIELD,
      ...COMMON_FIELDS,
    },
    defaultPopulates: ['type', 'level', 'technicalCondition', 'spaces'],
    defaultScopes: [...COMMON_DEFAULT_SCOPES, ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.names],
    scopes: {
      ...COMMON_SCOPES,
      ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.scopes,
    },
  },
  actions: ONLY_GET_REST_ENABLED,
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

  @Action()
  async fakeData(ctx: Context) {
    const sportsBasesTypes: SportsBasesType[] = await ctx.call('sportsBases.types.find');
    const sportsBasesLevels: SportsBasesLevel[] = await ctx.call('sportsBases.levels.find');
    const sportsBasesTechnicalConditions: SportsBasesTechnicalConditionsService[] = await ctx.call(
      'sportsBases.technicalConditions.find',
    );
    const sportsBasesSpacesTypes: SportBaseSpaceType[] = await ctx.call(
      'sportsBases.spaces.types.find',
    );
    const sportsBasesSpacesSportTypes: SportBaseSpaceSportType[] = await ctx.call(
      'sportsBases.spaces.sportTypes.find',
    );

    const sportsBasesBuildingTypes: SportsBasesBuildingType[] = await ctx.call(
      'sportsBases.buildingTypes.find',
    );

    const sportsBasesInvestmentsSources: SportBaseInvestmentSource[] = await ctx.call(
      'sportsBases.investments.sources.find',
    );

    function randomArray(length: number, cb: Function) {
      return Array.apply(null, Array(faker.number.int({ min: 1, max: length }))).map(cb);
    }

    function getPhotos() {
      return randomArray(5, (_: any, index: number) => ({
        url: faker.image.url(),
        description: faker.lorem.word(),
        representative: index === 0,
        public: faker.datatype.boolean(),
      }));
    }

    return randomArray(3, () => ({
      name: faker.lorem.words({ min: 1, max: 3 }),
      type: faker.helpers.arrayElement(sportsBasesTypes),
      level: faker.helpers.arrayElement(sportsBasesLevels),
      technicalCondition: faker.helpers.arrayElement(sportsBasesTechnicalConditions),
      address: faker.location.streetAddress(),
      coordinates: {
        x: faker.number.float({ min: 53, max: 55 }),
        y: faker.number.float({ min: 24, max: 27 }),
      },
      webPage: faker.internet.url(),
      photos: getPhotos(),
      plotNumber: `${faker.number.int(10000)}`,
      disabledAccessible: faker.datatype.boolean(),
      blindAccessible: faker.datatype.boolean(),
      plotArea: faker.number.int(1000),
      builtPlotArea: faker.number.int(1000),
      audienceSeats: faker.number.int(1000),
      parkingPlaces: faker.number.int(1000),
      dressingRooms: faker.number.int(10),
      methodicalClasses: faker.number.int(10),
      saunas: faker.number.int(10),
      diningPlaces: faker.number.int(5),
      accommodationPlaces: faker.number.int(100),
      publicWifi: faker.datatype.boolean(),
      spaces: randomArray(3, () => ({
        name: faker.lorem.words({ min: 1, max: 3 }),
        technicalCondition: faker.helpers.arrayElement(sportsBasesTechnicalConditions),
        type: faker.helpers.arrayElement(sportsBasesSpacesTypes),
        buildingType: faker.helpers.arrayElement(sportsBasesBuildingTypes),
        sportTypes: faker.helpers.arrayElements(sportsBasesSpacesSportTypes),
        buildingNumber: faker.number.int(10000),
        buildingPurpose: faker.lorem.sentence(),
        buildingArea: faker.number.int(1000),
        photos: getPhotos(),
        energyClassCertificate: {
          url: faker.internet.url(),
        },
      })),
      investments: randomArray(3, () => ({
        source: faker.helpers.arrayElement(sportsBasesInvestmentsSources),
        fundsAmount: faker.number.int({ min: 10000, max: 1000000 }),
        improvements: faker.lorem.sentence(),
        appointedAt: faker.date.anytime(),
      })),
    }));
  }

  @Method
  async seedDB() {
    if (process.env.NODE_ENV !== 'local') return;

    await this.broker.waitForServices([
      'sportsBases.spaces',
      'sportsBases.investments',
      'sportsBases.types',
      'sportsBases.levels',
      'sportsBases.technicalConditions',
      'sportsBases.spaces.types',
      'sportsBases.spaces.sportTypes',
      'sportsBases.buildingTypes',
      'sportsBases.investments.sources',
    ]);

    const sportsBasesData = await this.actions.fakeData();

    for (const sportBaseData of sportsBasesData) {
      await this.actions.applyOrValidateRequestChanges({
        entity: sportBaseData,
        apply: true,
      });
    }
  }
}
