'use strict';

import _ from 'lodash';
import { Context } from 'moleculer';
import { mergeRaw } from './database.mixin';
// @ts-ignore
import mToPsql from 'mongo-query-to-postgres-jsonb';

export default function (opts: any = {}) {
  const schema = {
    methods: {
      schemaArrayFields(fieldSchema: any, parents: string[] = []) {
        const arrayFields: string[] = [];

        if (!fieldSchema) {
          return arrayFields;
        }

        const fieldType = typeof fieldSchema === 'string' ? fieldSchema : fieldSchema.type;

        switch (fieldType) {
          case 'object': {
            const properties = fieldSchema?.properties || {};

            for (const key in properties) {
              const subFieldSchema = properties[key];
              const subParents = [...parents, key];
              const subArrayFields = this.schemaArrayFields(subFieldSchema, subParents);

              arrayFields.push(...subArrayFields);
            }

            break;
          }

          case 'array': {
            arrayFields.push(parents.join('.'));
          }
        }

        return arrayFields;
      },

      queryJson(ctx: Context<{ query?: any }>) {
        if (!ctx?.params?.query || !this?.settings?.fields) {
          return;
        }

        for (const fieldKey in ctx.params.query) {
          const fieldSettings = this.settings.fields[fieldKey];
          const queryValue: any = ctx.params.query[fieldKey];

          const snakeCaseFieldKey = _.snakeCase(fieldKey);
          // we handle only jsonb fields and if query value is object
          if (!['array', 'object'].includes(fieldSettings?.type) || !_.isObject(queryValue)) {
            continue;
          }

          let condition: string = '';

          switch (fieldSettings.type) {
            case 'array':
              const subCondition = mToPsql(
                `${snakeCaseFieldKey}_elem`,
                queryValue,
                this.schemaArrayFields(fieldSettings?.items),
              );
              condition = `EXISTS (
    SELECT 1
    FROM jsonb_array_elements(${snakeCaseFieldKey}) AS ${snakeCaseFieldKey}_elem
    WHERE ${subCondition}
)`;
              break;

            case 'object':
              condition = mToPsql(
                snakeCaseFieldKey,
                queryValue,
                this.schemaArrayFields(fieldSettings),
              );
              break;
          }

          ctx.params.query.$raw = mergeRaw(
            {
              condition,
              bindings: [],
            },
            ctx.params.query?.$raw,
          );

          delete ctx.params.query[fieldKey];
        }
      },
    },
    hooks: {
      before: {
        count: 'queryJson',
        list: 'queryJson',
        find: 'queryJson',
        all: 'queryJson',
      },
    },
  };

  return schema;
}
