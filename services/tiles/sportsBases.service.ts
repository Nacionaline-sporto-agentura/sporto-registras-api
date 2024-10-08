'use strict';

import { Knex } from 'knex';
import moleculer, { Context, GenericObject } from 'moleculer';
import { Action, Event, Method, Service } from 'moleculer-decorators';
import PostgisMixin from 'moleculer-postgis';
import Supercluster from 'supercluster';
import DbConnection, { MaterializedView } from '../../mixins/database.mixin';
import {
  ONLY_GET_REST_ENABLED,
  QueryObject,
  RestrictionType,
  throwNotFoundError,
} from '../../types';
// @ts-ignore
import vtpbf from 'vt-pbf';
import { SN_TILES_SPORTSBASES } from '../../types/serviceNames';
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
      collection: MaterializedView.SPORTS_BASES,
    }),
    PostgisMixin({
      srid: WGS_SRID,
      geojson: {
        maxDecimalDigits: 5,
      },
    }),
  ],
  settings: {
    auth: RestrictionType.PUBLIC,
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
    this.superclustersPromises = {};
    await this.renewSuperclusterIndex();
    await this.broker.cacher?.clean(`${this.fullName}.**`);
  }

  started() {
    this.superclusters = {};
    this.superclustersPromises = {};
  }
}
