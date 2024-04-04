'use strict';

import { Context, Validator } from 'moleculer';

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
        const { entity, oldEntity } = ctx.params;

        const fixValue = (value: any, settings: any) => {
          if (settings.type === 'array' && typeof value === 'object') {
            return Object.values(value);
          }

          return value;
        };

        // ==============================
        // Handle current service changes
        // ==============================

        if (!entity && oldEntity?.id) {
          return await this.removeEntity(ctx, {
            id: entity.id,
          });
        }

        let entityWithId: any;

        const updateData: any = {};
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
            id: oldEntity.id,
            ...updateData,
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
