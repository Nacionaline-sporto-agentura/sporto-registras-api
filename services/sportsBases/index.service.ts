'use strict';
import { faker } from '@faker-js/faker';
import moleculer, { Context, RestSchema } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../../mixins/database.mixin';

import RequestMixin, { REQUEST_FIELDS } from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  ONLY_GET_REST_ENABLED,
  RestrictionType,
  TENANT_FIELD,
  TYPE_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';

import filtersMixin from 'moleculer-knex-filters';
import PostgisMixin from 'moleculer-postgis';
import {
  SN_SPORTSBASES,
  SN_SPORTSBASES_INVESTMENTS,
  SN_SPORTSBASES_INVESTMENTS_SOURCES,
  SN_SPORTSBASES_LEVELS,
  SN_SPORTSBASES_OWNERS,
  SN_SPORTSBASES_SPACES,
  SN_SPORTSBASES_SPACES_TYPES,
  SN_SPORTSBASES_TECHNICALCONDITIONS,
  SN_SPORTSBASES_TENANTS,
  SN_SPORTSBASES_TYPES,
  SN_SPORTSPERSONS,
  SN_TENANTS,
  SN_TYPES_SPORTTYPES,
} from '../../types/serviceNames';
import {
  VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE,
  getSportsBaseUniqueSportTypes,
  handleFormatResponse,
} from '../../utils';
import { RequestEntityTypes } from '../requests/index.service';
import { Tenant, TenantTenantType } from '../tenants/index.service';
import { LKS_SRID } from '../tiles/sportsBases.service';
import { SportType } from '../types/sportTypes/index.service';
import { SportBaseInvestmentSource } from '../types/sportsBases/investments/sources.service';
import { SportsBasesLevel } from '../types/sportsBases/levels.service';
import { SportBaseSpaceType } from '../types/sportsBases/spaces/types.service';
import SportsBasesTechnicalConditionsService, {
  SportsBasesTechicalCondition,
} from '../types/sportsBases/technicalConditions.service';
import { SportsBasesType } from '../types/sportsBases/types.service';
import { SportBaseInvestment } from './investments/index.service';
import { SportsBaseOwner } from './owners.service';
import { SportBaseSpace } from './spaces.service';
import { SportsBaseTenant } from './tenants.service';

export enum AreaUnits {
  HA = 'HA',
  A = 'A',
  M2 = 'M2',
}

interface Fields extends CommonFields {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: SportsBasesType['id'];
  level: SportsBasesLevel['id'];
  technicalCondition: SportsBasesTechicalCondition['id'];
  address: {
    municipality: {
      code: number;
      name: string;
    };
    city: {
      code: number;
      name: string;
    };
    street: {
      code: number;
      name: string;
    };
    house: {
      code: number;
      plot_or_building_number: string;
    };
    apartment?: {
      code: number;
      room_number: string;
    };
  };
  geom: any;
  webPage: string;
  photos: Array<{
    url: string;
    description?: string;
    representative?: boolean;
    public?: boolean;
  }>;
  plotNumber: string;
  plotArea: number;
  areaUnits: AreaUnits;
  builtPlotArea: number;
  audienceSeats: number;
  parkingPlaces: number;
  methodicalClasses: number;
  saunas: number;
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
  spaces: SportBaseSpace<'technicalCondition' | 'type' | 'sportTypes' | 'buildingPurpose'>[];
  lastRequest: Request;
  investments: SportBaseInvestment<'items'>[];
  owners: SportsBaseOwner<'user' | 'tenant'>[];
  tenants: SportsBaseTenant<'basis'>[];
  tenant: Tenant;
  type: SportsBasesType;
}

export type SportsBase<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSBASES,
  mixins: [
    DbConnection({
      collection: 'sportsBases',
    }),
    PostgisMixin({
      srid: LKS_SRID,
      geojson: {
        maxDecimalDigits: 0,
      },
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
      name: 'string|required',
      email: 'string',
      phone: 'string',
      type: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseTypeId',
        immutable: true,
        required: true,
        populate: `${SN_SPORTSBASES_TYPES}.resolve`,
      },
      level: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseLevelId',
        immutable: true,
        required: true,
        populate: `${SN_SPORTSBASES_LEVELS}.resolve`,
      },
      technicalCondition: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseTechnicalConditionId',
        immutable: true,
        required: true,
        populate: `${SN_SPORTSBASES_TECHNICALCONDITIONS}.resolve`,
      },

      address: {
        type: 'object',
        required: true,
        properties: {
          municipality: {
            type: 'object',
            required: true,
            properties: {
              code: 'number|convert|required',
              name: 'string',
            },
          },
          city: {
            type: 'object',
            required: true,
            properties: {
              code: 'number|convert|required',
              name: 'string',
            },
          },
          street: {
            type: 'object',
            required: true,
            properties: {
              code: 'number|convert|required',
              name: 'string',
            },
          },
          house: {
            type: 'object',
            required: true,
            properties: {
              code: 'number|convert|required',
              plot_or_building_number: 'string',
            },
          },
          apartment: {
            type: 'object',
            properties: {
              code: 'number|convert|required',
              room_number: 'string',
            },
          },
        },
        get({ value }: any) {
          return Object.keys(value).reduce((acc: any, key: any) => {
            if (typeof value[key] !== 'string') return { ...acc, [key]: value[key] };

            try {
              return { ...acc, [key]: JSON.parse(value[key]) };
            } catch (err) {}
            return acc;
          }, {});
        },
      },
      geom: {
        type: 'any',
        required: true,
        geom: true,
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
      plotArea: 'number|required',
      areaUnits: {
        type: 'enum',
        required: true,
        values: Object.values(AreaUnits),
      },
      builtPlotArea: 'number|required',

      parkingPlaces: 'number|required',
      methodicalClasses: 'number|required',
      saunas: 'number|required',
      publicWifi: 'boolean',

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
          handler: PopulateHandlerFn(`${SN_SPORTSBASES_SPACES}.populateByProp`),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['technicalCondition', 'type', 'group', 'sportTypes', 'buildingType'],
            sort: 'name',
          },
        },
        requestHandler: {
          service: SN_SPORTSBASES_SPACES,
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
          handler: PopulateHandlerFn(`${SN_SPORTSBASES_INVESTMENTS}.populateByProp`),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['items'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_SPORTSBASES_INVESTMENTS,
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
          handler: PopulateHandlerFn(`${SN_SPORTSBASES_OWNERS}.populateByProp`),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['user', 'tenant'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_SPORTSBASES_OWNERS,
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
          handler: PopulateHandlerFn(`${SN_SPORTSBASES_TENANTS}.populateByProp`),
          params: {
            queryKey: 'sportBase',
            mappingMulti: true,
            populate: ['basis'],
            sort: '-createdAt',
          },
        },
        requestHandler: {
          service: SN_SPORTSBASES_TENANTS,
          relationField: 'sportBase',
        },
      },

      ...REQUEST_FIELDS(RequestEntityTypes.SPORTS_BASES),
      ...TENANT_FIELD,
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES, ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.names],
    scopes: {
      ...COMMON_SCOPES,
      ...VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE.scopes,
    },
  },
  actions: { ...ONLY_GET_REST_ENABLED },
})
export default class extends moleculer.Service {
  @Action({
    rest: 'GET /:id/base',
    params: {
      id: 'number|convert',
    },
  })
  base(ctx: Context<{ id: SportsBase['id'] }>) {
    return this.resolveEntities(ctx, {
      id: ctx.params.id,
      populate: [
        'lastRequest',
        'canCreateRequest',
        'type',
        'level',
        'technicalCondition',
        'spaces',
        'investments',
        'owners',
        'canValidate',
        'tenants',
        'geom',
      ],
    });
  }

  @Action({
    rest: <RestSchema>{
      method: 'GET',
      path: '/sportsRegister/count/public',
    },
    auth: RestrictionType.PUBLIC,
  })
  async publicSportsRegisterCount(ctx: Context) {
    const sportBases = await ctx.call(`${SN_SPORTSBASES}.count`);
    const organizations = await ctx.call(`${SN_TENANTS}.count`, {
      query: { name: { $exists: true }, tenantType: TenantTenantType.ORGANIZATION },
    });

    const sportsPersons = await ctx.call(`${SN_SPORTSPERSONS}.count`);

    return { sportBases, organizations, sportsPersons };
  }

  @Action({
    rest: <RestSchema>{
      method: 'GET',
      path: '/public',
    },
    auth: RestrictionType.PUBLIC,
    params: {
      pageSize: {
        type: 'number',
        convert: true,
        integer: true,
        optional: true,
        default: 10,
        min: 1,
      },
      page: {
        type: 'number',
        convert: true,
        integer: true,
        min: 1,
        optional: true,
        default: 1,
      },
    },
  })
  async publicSportBases(ctx: Context) {
    const params: any = ctx?.params || {};
    const page = params?.page;
    const pageSize = params?.pageSize;
    const sort = params?.sort;
    const query = params?.query;

    const sportsBases: SportsBase<'spaces' | 'tenant' | 'type'>[] = await ctx.call(
      'sportsBases.find',
      {
        fields: ['id', 'name', 'type', 'address', 'spaces', 'tenant', 'spaces'],
        populate: ['type', 'spaces', 'tenant'],
      },
    );

    const mappedSportsBases = sportsBases.map((sportsBase) => {
      const mappedSportsBase: any = {
        id: sportsBase.id,
        name: sportsBase.name,
        tenant: { id: sportsBase?.tenant?.id, name: sportsBase?.tenant?.name },
        municipality: sportsBase?.address?.municipality,
        type: { id: sportsBase.type.id, name: sportsBase?.type?.name },
        spacesCount: sportsBase?.spaces?.length,
        sportTypes: getSportsBaseUniqueSportTypes(sportsBase),
      };

      return mappedSportsBase;
    });

    return handleFormatResponse({
      data: mappedSportsBases,
      page,
      pageSize,
      sort,
      search: query,
    });
  }

  @Action({
    rest: <RestSchema>{
      method: 'GET',
      path: '/:id/public',
    },
    auth: RestrictionType.PUBLIC,
    params: {
      id: {
        type: 'number',
        convert: true,
      },
    },
  })
  async publicSportBase(ctx: Context<{ id: string }>) {
    const sportsBase: SportsBase<'tenant' | 'spaces' | 'tenants'> = await ctx.call(
      `${SN_SPORTSBASES}.resolve`,
      {
        ...ctx.params,
        fields: [
          'id',
          'name',
          'photos',
          'parkingPlaces',
          'methodicalClasses',
          'saunas',
          'publicWifi',
          'address',
          'tenant',
          'spaces',
        ],
        populate: ['spaces', 'tenant'],
        id: ctx.params.id,
        throwIfNotExist: true,
      },
    );

    const tenant = sportsBase?.tenant;

    const mappedSportsBase = {
      id: sportsBase.id,
      name: sportsBase.name,
      photos: sportsBase.photos,
      parkingPlaces: sportsBase.parkingPlaces,
      methodicalClasses: sportsBase.methodicalClasses,
      saunas: sportsBase.saunas,
      publicWifi: sportsBase.publicWifi,
      tenant: {
        name: tenant?.name,
        email: tenant?.email,
        phone: tenant?.phone,
        url: tenant?.data?.url,
      },
      address: sportsBase.address,
      spaceBuildingDate: sportsBase.spaces.reduce((oldest, current) => {
        return current.constructionDate < oldest ? current.constructionDate : oldest;
      }, sportsBase.spaces[0].constructionDate),
      type: sportsBase.type,
      spaces: sportsBase?.spaces?.map((space) => ({
        name: space?.name,
        type: { id: space?.type?.id, name: space?.type?.name },
        sportTypes: space?.sportTypes.map((sportType) => ({
          id: sportType.id,
          name: sportType.name,
        })),
        technicalCondition: {
          id: space?.technicalCondition?.id,
          name: space?.technicalCondition?.name,
        },
        additionalValues: space?.additionalValues,
      })),
      tenants: sportsBase?.tenants?.map((tenant) => ({
        name: tenant.companyName,
        code: tenant.companyCode,
        basis: tenant.basis,
      })),
      sportTypes: getSportsBaseUniqueSportTypes(sportsBase),
    };

    return mappedSportsBase;
  }

  @Method
  validatePhotos({ value, operation }: FieldHookCallback) {
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
    const sportsBasesTypes: SportsBasesType[] = await ctx.call(`${SN_SPORTSBASES_TYPES}.find`);
    const sportsBasesLevels: SportsBasesLevel[] = await ctx.call(`${SN_SPORTSBASES_LEVELS}.find`);
    const sportsBasesTechnicalConditions: SportsBasesTechnicalConditionsService[] = await ctx.call(
      `${SN_SPORTSBASES_TECHNICALCONDITIONS}.find`,
    );
    const sportsBasesSpacesTypes: SportBaseSpaceType[] = await ctx.call(
      `${SN_SPORTSBASES_SPACES_TYPES}.find`,
    );
    const sportsBasesSpacesSportTypes: SportType[] = await ctx.call(`${SN_TYPES_SPORTTYPES}.find`);

    const sportsBasesInvestmentsSources: SportBaseInvestmentSource[] = await ctx.call(
      `${SN_SPORTSBASES_INVESTMENTS_SOURCES}.find`,
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

    function getGeom() {
      try {
        const wgsCoordinates = faker.location.nearbyGPSCoordinate({
          isMetric: true,
          origin: [23.930085, 55.237194],
          radius: 20,
        });
        const transformation = require('transform-coordinates');
        const transform = transformation('EPSG:4326', '3346'); // WGS 84 to LKS
        const lksCoordinates = transform.forward(wgsCoordinates);
        return {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: lksCoordinates,
              },
            },
          ],
        };
      } catch (e) {
        console.log('Error while generating coordinates');
      }
    }

    return randomArray(
      30,
      (): Partial<SportsBase> => ({
        name: faker.lorem.words({ min: 1, max: 3 }),
        type: faker.helpers.arrayElement(sportsBasesTypes).id,
        level: faker.helpers.arrayElement(sportsBasesLevels).id,
        technicalCondition: faker.helpers.arrayElement(sportsBasesTechnicalConditions).id,
        address: {
          municipality: {
            name: faker.location.county(),
            code: faker.number.int(),
          },
          city: {
            name: faker.location.city(),
            code: faker.number.int(),
          },
          street: {
            name: faker.location.street(),
            code: faker.number.int(),
          },
          house: {
            plot_or_building_number: faker.location.buildingNumber(),
            code: faker.number.int(),
          },
          apartment: {
            room_number: faker.location.buildingNumber(),
            code: faker.number.int(),
          },
        },
        webPage: faker.internet.url(),
        photos: getPhotos(),
        plotNumber: `${faker.number.int(10000)}`,
        plotArea: faker.number.int(1000),
        areaUnits: faker.helpers.enumValue(AreaUnits),
        builtPlotArea: faker.number.int(1000),
        audienceSeats: faker.number.int(1000),
        parkingPlaces: faker.number.int(1000),
        methodicalClasses: faker.number.int(10),
        saunas: faker.number.int(10),
        publicWifi: faker.datatype.boolean(),
        spaces: randomArray(3, () => ({
          name: faker.lorem.words({ min: 1, max: 3 }),
          technicalCondition: faker.helpers.arrayElement(sportsBasesTechnicalConditions),
          type: faker.helpers.arrayElement(sportsBasesSpacesTypes),
          buildingPurpose: faker.lorem.words({ min: 1, max: 2 }),
          energyClass: faker.string.alpha().toUpperCase(),
          sportTypes: faker.helpers.arrayElements(sportsBasesSpacesSportTypes),
          buildingNumber: faker.number.int(10000),
          buildingArea: faker.number.int(1000),
          photos: getPhotos(),
        })),
        investments: randomArray(3, () => ({
          source: faker.helpers.arrayElement(sportsBasesInvestmentsSources),
          fundsAmount: faker.number.int({ min: 10000, max: 1000000 }),
          improvements: faker.lorem.sentence(),
          appointedAt: faker.date.anytime(),
        })),
        geom: getGeom(),
      }),
    );
  }

  @Method
  async seedDB() {
    if (process.env.NODE_ENV !== 'local') return;

    await this.broker.waitForServices([
      SN_SPORTSBASES_SPACES,
      SN_SPORTSBASES_INVESTMENTS,
      SN_SPORTSBASES_TYPES,
      SN_SPORTSBASES_LEVELS,
      SN_SPORTSBASES_TECHNICALCONDITIONS,
      SN_SPORTSBASES_SPACES_TYPES,
      SN_TYPES_SPORTTYPES,
      SN_SPORTSBASES_INVESTMENTS_SOURCES,
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
