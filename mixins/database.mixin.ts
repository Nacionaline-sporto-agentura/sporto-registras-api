'use strict';

import _ from 'lodash';
import { Context } from 'moleculer';
const DbService = require('@moleculer/database').Service;
const knex = require('../knexfile');

export const MaterializedView = {
  ORGANIZATIONS: 'publishing.organizations',
  SPORTS_BASES: 'publishing.sportsBases',
};

type ActionType = string | { [key: string]: string };

const PromiseAllObject = (obj: any) => {
  if (obj && !obj[Symbol.iterator]) {
    return Promise.all(Object.entries(obj).map(async ([k, v]) => [k, await v])).then(
      Object.fromEntries,
    );
  }
  return Promise.all(obj);
};

export function PopulateHandlerFn(action: ActionType) {
  const populateSubproperties = _.isObject(action);

  return async function (
    ctx: Context<{ populate: string | string[] }>,
    values: any[],
    docs: any[],
    field: any,
  ) {
    if (!values.length) return null;
    const rule = field.populate;
    let populate = rule.params?.populate;
    if (rule.inheritPopulate) {
      populate = ctx.params.populate;
    }

    let fieldName = field.name;
    if (rule.keyField) {
      fieldName = rule.keyField;
    }

    async function getValuesByKey(values: any[], action: ActionType): Promise<any> {
      if (_.isObject(action)) {
        const promisesByActionKeys = Object.keys(action).reduce((acc: any, key: string) => {
          const keyValues = values.map((v) => v[key]);

          return { ...acc, [key]: getValuesByKey(keyValues, action[key]) };
        }, {});

        return PromiseAllObject(promisesByActionKeys);
      }

      const params = {
        ...(rule.params || {}),
        id: values,
        mapping: true,
        populate,
        throwIfNotExist: false,
      };

      return ctx.call(action, params, rule.callOptions);
    }

    const byKey: any = await getValuesByKey(values, action);

    function mapValues(fieldValue: any) {
      return Object.keys(fieldValue).reduce((acc: any, key: string) => {
        let value = fieldValue[key];
        if (!value) return acc;

        if (byKey[key]) {
          if (!fieldValue[key]) return acc;
          value = byKey[key][`${fieldValue[key]}`];
        }

        return { ...acc, [key]: value };
      }, {});
    }

    return docs?.map((d) => {
      const fieldValue = d[fieldName];
      if (!fieldValue) return null;

      if (populateSubproperties) {
        if (Array.isArray(fieldValue)) {
          return fieldValue.map(mapValues);
        }
        return mapValues(fieldValue);
      }
      return byKey[fieldValue] || null;
    });
  };
}

function makeMapping(
  data: any[],
  mapping?: string,
  options?: {
    mappingMulti?: boolean;
    mappingField?: string;
  },
) {
  if (!mapping) return data;

  return data?.reduce((acc: any, item) => {
    let value: any = item;

    if (options?.mappingField) {
      value = item[options.mappingField];
    }

    if (options?.mappingMulti) {
      return {
        ...acc,
        [`${item[mapping]}`]: [...(acc[`${item[mapping]}`] || []), value],
      };
    }

    if (acc[item[mapping]]) {
      return acc;
    }

    return { ...acc, [`${item[mapping]}`]: value };
  }, {});
}

export default function (opts: any = {}) {
  const adapter: any = {
    type: 'Knex',
    options: {
      knex,
      tableName: opts.collection,
    },
  };

  const cache = {
    enabled: false,
  };

  opts = _.defaultsDeep(opts, { adapter }, { cache: opts.cache || cache });

  const removeRestActions: any = {};

  if (opts?.createActions === undefined || opts?.createActions !== false) {
    removeRestActions.replace = {
      rest: null as any,
    };
  }

  const schema = {
    mixins: [DbService(opts)],

    actions: {
      ...removeRestActions,

      findOne(ctx: any) {
        return this.findEntity(ctx);
      },

      async updateMany(ctx: any) {
        const updatedItems = await Promise.all(
          ctx.params.map(async (item: any) => await this.updateEntity(ctx, { ...item })),
        );

        return updatedItems;
      },

      async removeMany(ctx: any) {
        return this.removeEntities(ctx);
      },

      async removeAllEntities(ctx: any) {
        return this.clearEntities(ctx);
      },

      async populateByProp(
        ctx: Context<{
          id: number | number[];
          queryKey: string;
          query: any;
          mapping?: boolean;
          mappingMulti?: boolean;
          mappingField: string;
        }>,
      ): Promise<any> {
        const { queryKey, query, mapping, mappingMulti, mappingField } = ctx.params;

        const ids = Array.isArray(ctx.params.id) ? ctx.params.id : [ctx.params.id];

        delete ctx.params.queryKey;
        delete ctx.params.id;
        delete ctx.params.mapping;
        delete ctx.params.mappingMulti;
        delete ctx.params.mappingField;

        const entities = await this.findEntities(ctx, {
          ...ctx.params,
          query: {
            ...(query || {}),
            [queryKey]: { $in: ids },
          },
        });

        const resultById = makeMapping(entities, mapping ? queryKey : '', {
          mappingMulti,
          mappingField: mappingField,
        });

        return ids.reduce(
          (acc: any, id) => ({
            ...acc,
            [`${id}`]: resultById[id] || (mappingMulti ? [] : ''),
          }),
          {},
        );
      },
    },

    methods: {
      filterQueryIds(ids: number[], queryIds?: any) {
        if (!queryIds) return ids;

        queryIds = (Array.isArray(queryIds) ? queryIds : [queryIds]).map((id: any) => parseInt(id));

        return ids.filter((id) => queryIds.indexOf(id) >= 0);
      },
      async refreshMaterializedView(ctx: Context, name: string) {
        const adapter = await this.getAdapter(ctx);

        await adapter.client.schema.refreshMaterializedView(name);
        return {
          success: true,
        };
      },
      async rawQuery(ctx: Context, sql: string) {
        const adapter = await this.getAdapter(ctx);
        const knex = adapter.client;
        const result = await knex.raw(sql);
        return result.rows;
      },
    },
    hooks: {
      after: {
        find: [
          async function (
            ctx: Context<{
              mapping: string;
              mappingMulti: boolean;
              mappingField: string;
            }>,
            data: any[],
          ) {
            const { mapping, mappingMulti, mappingField } = ctx.params;
            return makeMapping(data, mapping, {
              mappingMulti,
              mappingField,
            });
          },
        ],
      },
    },

    merged(schema: any) {
      if (schema.actions) {
        for (const action in schema.actions) {
          const params = schema.actions[action].additionalParams;
          if (typeof params === 'object') {
            schema.actions[action].params = {
              ...schema.actions[action].params,
              ...params,
            };
          }
        }
      }
    },

    async started() {
      // Seeding if the DB is empty
      const count = await this.countEntities(null, {
        scope: false,
      });

      if (count == 0 && _.isFunction(this.seedDB)) {
        this.logger.info(`Seed '${opts.collection}' collection...`);
        await this.seedDB();
      }
    },
  };

  return schema;
}
