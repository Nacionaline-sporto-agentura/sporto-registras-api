'use strict';

import { Knex } from 'knex';
import moleculer, { Context, GenericObject } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';
import PostgisMixin from 'moleculer-postgis';
import { PopulateHandlerFn } from 'moleculer-postgis/src/mixin';
import Supercluster from 'supercluster';
import DbConnection from '../../mixins/database.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  QueryObject,
  RestrictionType,
  throwNotFoundError,
} from '../../types';
// @ts-ignore
import vtpbf from 'vt-pbf';
import {
  SN_SPORTSBASES_INVESTMENTS,
  SN_SPORTSBASES_LEVELS,
  SN_SPORTSBASES_OWNERS,
  SN_SPORTSBASES_SPACES,
  SN_SPORTSBASES_TECHNICALCONDITIONS,
  SN_SPORTSBASES_TENANTS,
  SN_SPORTSBASES_TYPES,
  SN_TILES_SPORTSBASES,
} from '../../types/serviceNames';
import { SportsBase } from '../sportsBases/index.service';

export type TilesSportsBase = SportsBase;

const superclusterOpts = {
  radius: 64,
  extent: 512,
  generateId: true,
  reduce: (acc: any, props: any) => acc,
};

const isLocalDevelopment = process.env.NODE_ENV === 'local';
export const WGS_SRID = 4326;
export const LKS_SRID = 3346;

function getSuperclusterHash(query: any = {}) {
  if (typeof query !== 'string') {
    query = JSON.stringify(query);
  }
  return query || 'default';
}

export function parseToJsonIfNeeded(query: QueryObject | string): QueryObject {
  if (!query) return;

  if (typeof query === 'string') {
    try {
      query = JSON.parse(query);
    } catch (err) {}
  }

  return query as QueryObject;
}

@Service({
  name: SN_TILES_SPORTSBASES,
  mixins: [
    DbConnection({
      collection: 'sportsBases',
      createActions: {
        create: false,
        update: false,
        createMany: false,
        remove: false,
      },
    }),
    PostgisMixin({
      srid: WGS_SRID,
      geojson: {
        maxDecimalDigits: 5,
      },
    }),
  ],
  settings: {
    fields: {
      id: {
        type: 'number',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      name: 'string',
      email: 'string',
      phone: 'string',
      type: {
        columnName: 'sportBaseTypeId',
        populate: `${SN_SPORTSBASES_TYPES}.resolve`,
      },
      level: {
        columnName: 'sportBaseLevelId',
        populate: `${SN_SPORTSBASES_LEVELS}.resolve`,
      },
      technicalCondition: {
        columnName: 'sportBaseTechnicalConditionId',
        populate: `${SN_SPORTSBASES_TECHNICALCONDITIONS}.resolve`,
      },

      address: {
        type: 'object',
        properties: {
          municipality: 'string',
          city: 'string',
          street: 'string',
          house: 'string',
          apartment: 'string',
        },
      },
      geom: {
        type: 'any',
        geom: {
          properties: ['id'],
        },
      },
      webPage: 'string',
      photos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: 'string',
            description: 'string',
            representative: {
              type: 'boolean',
            },
            public: {
              type: 'boolean',
            },
          },
        },
        validate: 'validatePhotos',
        min: 1,
      },
      plotNumber: 'string',
      disabledAccessible: 'boolean', // for people with physical disability
      blindAccessible: 'boolean', // for blind people
      plotArea: 'number',
      builtPlotArea: 'number',

      parkingPlaces: 'number',
      dressingRooms: 'number',
      methodicalClasses: 'number',
      saunas: 'number',
      diningPlaces: 'number',
      accommodationPlaces: 'number',
      publicWifi: 'boolean',

      plans: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: 'string',
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
            populate: ['technicalCondition', 'type', 'sportTypes', 'buildingType'],
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

      ...COMMON_FIELDS,
    },
    scopes: {
      ...COMMON_SCOPES,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: {
    list: {
      auth: RestrictionType.PUBLIC,
    },
    get: {
      auth: RestrictionType.PUBLIC,
    },
    find: {
      rest: null,
    },
    count: {
      rest: null,
    },
  },
  hooks: {
    before: {
      list: ['applyFilters'],
      find: ['applyFilters'],
      get: ['applyFilters'],
      resolve: ['applyFilters'],
      getSportsBasesFeatureCollection: ['applyFilters'],
    },
  },
})
export default class TilesEventsService extends moleculer.Service {
  @Action({
    rest: 'GET /:z/:x/:y',
    params: {
      x: 'number|convert|min:0|integer',
      z: 'number|convert|min:0|integer',
      y: 'number|convert|min:0|integer',
      query: ['object|optional', 'string|optional'],
    },
    auth: RestrictionType.PUBLIC,

    timeout: 0,
  })
  async getTile(
    ctx: Context<
      { x: number; y: number; z: number; query: string | GenericObject },
      { $responseHeaders: any; $responseType: string }
    >,
  ) {
    const { x, y, z } = ctx.params;

    ctx.params.query = parseToJsonIfNeeded(ctx.params.query);
    ctx.meta.$responseType = 'application/x-protobuf';

    // make clusters
    if (z <= 12) {
      const supercluster: Supercluster = await this.getSupercluster(ctx);

      const tileSportsBases = supercluster.getTile(z, x, y);

      const layers: any = {};

      if (tileSportsBases) {
        layers.sportsBases = tileSportsBases;
      }

      return Buffer.from(
        vtpbf.fromGeojsonVt(layers, { extent: superclusterOpts.extent, version: 2 }),
      );
    }

    // show real geometries
    const tileData = await this.getMVTTiles(ctx);
    return tileData.tile;
  }

  @Action({
    rest: 'GET /cluster/:cluster/items',
    params: {
      cluster: 'number|convert|positive|integer',
      page: 'number|convert|positive|integer|optional',
      pageSize: 'number|convert|positive|integer|optional',
    },

    auth: RestrictionType.PUBLIC,
  })
  async getTileItems(
    ctx: Context<
      {
        cluster: number;
        query: string | GenericObject;
        page?: number;
        pageSize?: number;
        populate?: string | string[];
        sort?: string | string[];
      },
      { $responseHeaders: any; $responseType: string }
    >,
  ) {
    const { cluster } = ctx.params;
    const page = ctx.params.page || 1;
    const pageSize = ctx.params.pageSize || 10;
    const { sort, populate } = ctx.params;
    const supercluster: Supercluster = await this.getSupercluster(ctx);

    if (!supercluster) throwNotFoundError('No items!');

    const ids = supercluster.getLeaves(cluster, Infinity).map((i) => i.properties.id);

    if (!ids?.length) {
      return {
        rows: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    return ctx.call(`${SN_TILES_SPORTSBASES}.list`, {
      query: {
        // knex support for `$in` is limited to 30K or smth
        $raw: `id IN ('${ids.join("', '")}')`,
      },
      populate,
      page,
      pageSize,
      sort,
    });
  }

  @Method
  async getMVTTiles(ctx: Context<{ query: any; x: number; y: number; z: number }>) {
    ctx = await this.applyFilters(ctx);
    const adapter = await this.getAdapter(ctx);
    const table = adapter.getTable();
    const knex: Knex = adapter.client;

    const query = await this.getComputedQuery(ctx);

    const fields = ['id'];
    const { x, y, z } = ctx.params;

    const WM_SRID = 3857;
    const envelopeQuery = `ST_TileEnvelope(${z}, ${x}, ${y})`;
    const transformedEnvelopeQuery = `ST_Transform(${envelopeQuery}, ${LKS_SRID})`;
    const transformedGeomQuery = `ST_Transform(ST_CurveToLine("geom"), ${WM_SRID})`;

    const asMvtGeomQuery = adapter
      .computeQuery(table, query)
      .whereRaw(`ST_Intersects(sports_bases.geom, ${transformedEnvelopeQuery})`)
      .select(
        ...fields,
        knex.raw(`ST_AsMVTGeom(${transformedGeomQuery}, ${envelopeQuery}, 4096, 64, true) AS geom`),
      );

    const tileQuery = knex
      .select(knex.raw(`ST_AsMVT(tile, 'sportsBases', 4096, 'geom') as tile`))
      .from(asMvtGeomQuery.as('tile'))
      .whereNotNull('geom');

    return tileQuery.first();
  }

  @Action({
    timeout: 0,
  })
  async getSportsBasesFeatureCollection(ctx: Context<{ query: any }>) {
    const adapter = await this.getAdapter(ctx);
    const table = adapter.getTable();
    const knex = adapter.client;

    const query = await this.getComputedQuery(ctx);
    const fields = ['id'];

    const sportsBasesQuery = adapter
      .computeQuery(table, query)
      .select(...fields, knex.raw(`ST_Transform(ST_PointOnSurface(geom), ${WGS_SRID}) as geom`));

    const res = await knex
      .select(knex.raw(`ST_AsGeoJSON(e)::json as feature`))
      .from(sportsBasesQuery.as('e'));

    return {
      type: 'FeatureCollection',
      features: res.map((i: any) => i.feature),
    };
  }

  @Method
  async getComputedQuery(ctx: Context<{ query: any }>) {
    let { params } = ctx;
    params = this.sanitizeParams(params);
    params = await this._applyScopes(params, ctx);
    params = this.paramsFieldNameConversion(params);

    return parseToJsonIfNeeded(params.query) || {};
  }

  @Method
  async getSupercluster(ctx: Context<{ query: any }>) {
    const hash = getSuperclusterHash(ctx.params.query);

    if (!this.superclusters?.[hash]) {
      await this.renewSuperclusterIndex(ctx.params.query);
    }

    return this.superclusters[hash];
  }

  @Method
  async renewSuperclusterIndex(query: any = {}) {
    // TODO: apply to all superclusters (if exists)
    const hash = getSuperclusterHash(query);

    const supercluster = new Supercluster(superclusterOpts);

    // Singleton!
    if (this.superclustersPromises[hash]) {
      return this.superclustersPromises[hash];
    }

    this.superclustersPromises[hash] = this.actions.getSportsBasesFeatureCollection({ query });
    const featureCollection: any = await this.superclustersPromises[hash];

    supercluster.load(featureCollection.features || []);
    this.superclusters[hash] = supercluster;

    delete this.superclustersPromises[hash];
  }

  @Method
  async applyFilters(ctx: Context<any>) {
    ctx.params.query = parseToJsonIfNeeded(ctx.params.query) || {};
    return ctx;
  }

  @Event()
  async '$broker.started'() {
    this.superclusters = {};
    this.superclustersPromises = {};
    // This takes time
    if (!isLocalDevelopment) {
      try {
        await this.renewSuperclusterIndex();
      } catch (err) {
        console.error('Cannot create super clusters', err);
      }
    }
  }

  @Event()
  async 'cache.clean.tiles.sportsBases'() {
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }

  @Event()
  async 'integrations.sync.finished'() {
    this.superclustersPromises = {};
    await this.renewSuperclusterIndex();
  }

  started() {
    this.superclusters = {};
    this.superclustersPromises = {};
  }
}
