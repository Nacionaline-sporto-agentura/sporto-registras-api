'use strict';

import _ from 'lodash';
import { Context, Validator } from 'moleculer';
import { UserAuthMeta } from '../services/api.service';

const {
  validator: { parseShortHand },
}: any = new Validator();

type Field = {
  type: string;
  virtual: true;
  requestHandler?: {
    service: 'string';
    relationField?: 'string';
    ignoreField?: boolean;
  };
};

export type RequestMutationPreHook<T = object> = {
  ctx: Context<unknown, UserAuthMeta>;
  type: 'remove' | 'update' | 'create';
  data: Partial<T>;
  oldData?: Partial<T>;
};

const getFieldSettings = (fieldSettings: any) => {
  const settings =
    typeof fieldSettings === 'string' ? parseShortHand(fieldSettings) : fieldSettings;

  if (settings.requestHandler) {
    switch (typeof settings.requestHandler) {
      case 'boolean':
        settings.requestHandler = { ignoreField: !settings.requestHandler };
        break;

      case 'string':
        settings.requestHandler = { service: settings.requestHandler };
    }
  }

  return settings;
};

const RequestMixin = {
  actions: {
    applyRequestChanges: {
      params: {
        entity: 'object|optional',
        oldEntity: 'object|optional',
      },
      async handler(ctx: Context<{ entity?: any; oldEntity?: any }>) {
        const { id, ...serviceFields } = ctx.service.settings.fields;
        let { entity, oldEntity } = ctx.params;

        const fixValue = (value: any, settings: any) => {
          if (settings.type === 'array' && typeof value === 'object') {
            return Object.values(value);
          }

          return value;
        };

        // ==============================
        // Handle current service changes
        // ==============================

        let opertion: RequestMutationPreHook['type'];
        if (!entity && oldEntity?.id) {
          opertion = 'remove';
        } else if (oldEntity?.id) {
          opertion = 'update';
        } else {
          opertion = 'create';
        }

        if (_.isFunction(this.requestMutationPreHook)) {
          entity = await this.requestMutationPreHook({
            ctx,
            type: opertion,
            data: entity,
            oldData: oldEntity,
          });
        }

        if (opertion === 'remove') {
          return await this.removeEntity(ctx, {
            id: oldEntity.id,
          });
        }

        let entityWithId: any;

        let updateData: any = {};
        for (const fieldName in serviceFields) {
          // field settings object
          const field: Field = getFieldSettings(serviceFields[fieldName]);

          // remote fields will be handled later (entity id might be needed)
          if (field.virtual || field.requestHandler?.service || field.requestHandler?.ignoreField)
            continue;

          if (entity[fieldName] !== oldEntity?.[fieldName]) {
            updateData[fieldName] = fixValue(entity[fieldName], field);
          }
        }

        if (oldEntity?.id) {
          entityWithId = await this.updateEntity(ctx, {
            ...updateData,
            id: oldEntity.id,
          });
        } else {
          entityWithId = await this.createEntity(ctx, updateData);
        }

        // ==============================
        // Handle remote fields
        // ==============================

        for (const fieldName in serviceFields) {
          // field settings object
          const field: Field = getFieldSettings(serviceFields[fieldName]);

          if (field.requestHandler?.service) {
            const handlerAction = `${field.requestHandler.service}.applyRequestChanges`;

            // TODO: simplify ifs
            if (field.type === 'array') {
              // Handle inserts and updates
              for (const childEntity of fixValue(entity[fieldName], field)) {
                const oldChildEntity =
                  childEntity.id &&
                  oldEntity?.[fieldName]?.find((e: any) => childEntity.id === e.id);

                if (field.requestHandler.relationField) {
                  childEntity[field.requestHandler.relationField] = entityWithId.id;
                }

                // updates creates
                // TODO: hooks
                await ctx.call(handlerAction, {
                  entity: childEntity,
                  oldEntity: oldChildEntity,
                });
              }

              // Handle removes
              if (Array.isArray(oldEntity?.[fieldName])) {
                for (const oldChildEntity of oldEntity[fieldName]) {
                  const childEntity =
                    oldChildEntity.id &&
                    entity?.[fieldName]?.find((e: any) => oldChildEntity.id === e.id);

                  if (!childEntity) {
                    //removes
                    await ctx.call(handlerAction, {
                      oldEntity: oldChildEntity,
                    });
                  }
                }
              }
            }
          }
        }

        return entityWithId;
      },
    },
  },
};

export default RequestMixin;
