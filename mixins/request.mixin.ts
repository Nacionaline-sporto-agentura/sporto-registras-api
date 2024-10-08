'use strict';

import { Context, Validator } from 'moleculer';
import { UserAuthMeta } from '../services/api.service';
import { RequestEntityTypes, RequestStatus } from '../services/requests/index.service';
import { PopulateHandlerFn } from './database.mixin';

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

export const REQUEST_FIELDS = (entityType: RequestEntityTypes) => ({
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
          entityType,
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
});

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
  methods: {
    // Frontend converts arrays to objects to better track changes
    fixArrayValue(value: any, settings: any) {
      if (settings.type === 'array') {
        if (Array.isArray(value)) {
          return value;
        }

        if (typeof value === 'object') {
          return Object.values(value);
        }

        return [];
      }

      return value;
    },
    forceArrayValue(value: any, settings: any) {
      if (settings.type === 'array') {
        return this.fixArrayValue(value, settings);
      }

      return value ? [value] : [];
    },
  },

  actions: {
    applyOrValidateRequestChanges: {
      params: {
        entity: 'object|optional',
        oldEntity: 'object|optional',
        apply: {
          type: 'boolean',
          validate: false,
        },
      },
      async handler(ctx: Context<{ entity?: any; oldEntity?: any; apply: boolean }>) {
        const { id, ...serviceFields } = ctx.service.settings.fields;
        let { entity, oldEntity, apply } = ctx.params;
        const validate = !apply;
        const invalidFields: Record<string, any> = {};

        let opertion: 'remove' | 'update' | 'create';
        if (!entity && oldEntity?.id) {
          opertion = 'remove';
        } else if (oldEntity?.id) {
          opertion = 'update';
        } else {
          opertion = 'create';
        }

        // ==============================
        // Handle remote fields where relation id needed on current service
        // ==============================

        for (const fieldName in serviceFields) {
          // field settings object
          const field: Field = getFieldSettings(serviceFields[fieldName]);

          if (field.requestHandler?.service && !field.requestHandler?.relationField) {
            const handlerAction = `${field.requestHandler.service}.applyOrValidateRequestChanges`;

            const arrValues = this.forceArrayValue(entity[fieldName], field);
            // Handle inserts and updates
            for (const childEntityKey in arrValues) {
              const childEntity = arrValues[childEntityKey];
              const oldChildEntity =
                childEntity.id && oldEntity?.[fieldName]?.find((e: any) => childEntity.id === e.id);

              // updates creates
              const response: boolean | Record<string, any> = await ctx.call(handlerAction, {
                entity: childEntity,
                oldEntity: oldChildEntity,
                apply,
              });

              if (validate) {
                if (response !== true) {
                  invalidFields[fieldName] ||= {};
                  invalidFields[fieldName][childEntityKey] = response;
                } else {
                  // TODO: de-hardcode 111, better remove from validation fields
                  arrValues[childEntityKey] = 111;
                }
              } else {
                arrValues[childEntityKey] = (response as any)?.id;
              }
            }

            if (field.type === 'array') {
              entity[fieldName] = arrValues;
            } else {
              entity[fieldName] = arrValues[0];
            }

            // Handle removes
            if (Array.isArray(oldEntity?.[fieldName])) {
              for (const oldChildEntity of oldEntity[fieldName]) {
                const childEntity =
                  oldChildEntity.id &&
                  entity?.[fieldName]?.find?.((e: any) => oldChildEntity.id === e.id);

                if (!childEntity) {
                  //removes
                  await ctx.call(handlerAction, {
                    oldEntity: oldChildEntity,
                    apply,
                  });
                }
              }
            }
          }
        }

        // ==============================
        // Handle current service changes
        // ==============================

        if (opertion === 'remove') {
          if (validate) {
            return true;
          }

          try {
            return this.removeEntity(ctx, {
              id: oldEntity.id,
            });
          } catch (e) {
            this.logger.error('APPLY_REQUEST_CHANGES_ERROR: remove', e);
            return false;
          }
        }

        let entityWithId: any = {};

        let updateData: any = {};
        for (const fieldName in serviceFields) {
          // field settings object
          const field: Field = getFieldSettings(serviceFields[fieldName]);

          // remote fields will be handled later (entity id might be needed)
          if (field.virtual || field.requestHandler?.ignoreField) continue;

          if (entity[fieldName] !== oldEntity?.[fieldName]) {
            updateData[fieldName] = this.fixArrayValue(entity[fieldName], field);
          }
        }

        if (oldEntity?.id) {
          updateData.id = oldEntity.id;

          if (validate) {
            const res = await this.validateParams(ctx, updateData, { type: 'update' });
            if (Array.isArray(res)) {
              for (const er of res) {
                invalidFields[er.field] = er.message;
              }
            }
          } else {
            try {
              entityWithId = await this.updateEntity(ctx, updateData);
            } catch (e) {
              this.logger.error('APPLY_REQUEST_CHANGES_ERROR: update', e);
            }
          }
        } else {
          if (validate) {
            // TODO: jei noretusi de-hardcodinti 111 (zemiau esanti), galima naudot (pasalinus fielda): this_validateObject(ctx, fields, params, opts);
            const res = await this.validateParams(ctx, updateData, { type: 'create' });

            if (Array.isArray(res)) {
              for (const er of res) {
                invalidFields[er.field] = er.message;
              }
            }
          } else {
            try {
              entityWithId = await this.createEntity(ctx, updateData);
            } catch (e) {
              this.logger.error('APPLY_REQUEST_CHANGES_ERROR: insert', e);
            }
          }
        }

        // ==============================
        // Handle remote fields
        // ==============================

        if (entityWithId?.id) {
          for (const fieldName in serviceFields) {
            // field settings object
            const field: Field = getFieldSettings(serviceFields[fieldName]);

            if (field.requestHandler?.service && field.requestHandler?.relationField) {
              const handlerAction = `${field.requestHandler.service}.applyOrValidateRequestChanges`;

              const arrValues = this.forceArrayValue(entity[fieldName], field);
              // Handle inserts and updates
              for (const childEntityKey in arrValues) {
                const childEntity = arrValues[childEntityKey];
                const oldChildEntity =
                  childEntity.id &&
                  oldEntity?.[fieldName]?.find((e: any) => childEntity.id === e.id);

                if (field.requestHandler.relationField) {
                  if (validate) {
                    // TODO: de-hardcode 111, better remove from validation fields
                    childEntity[field.requestHandler.relationField] = 111;
                  } else {
                    childEntity[field.requestHandler.relationField] = entityWithId.id;
                  }
                }

                // updates creates
                const response: boolean | Record<string, any> = await ctx.call(handlerAction, {
                  entity: childEntity,
                  oldEntity: oldChildEntity,
                  apply,
                });

                if (validate && response !== true) {
                  invalidFields[fieldName] ||= {};
                  invalidFields[fieldName][childEntityKey] = response;
                }
              }

              // TODO: handle deletes before updates/inserts - for unique validates
              // Handle removes
              if (Array.isArray(oldEntity?.[fieldName])) {
                for (const oldChildEntity of oldEntity[fieldName]) {
                  const childEntity =
                    oldChildEntity.id &&
                    entity?.[fieldName]?.find?.((e: any) => oldChildEntity.id === e.id);

                  if (!childEntity) {
                    //removes
                    await ctx.call(handlerAction, {
                      oldEntity: oldChildEntity,
                      apply,
                    });
                  }
                }
              }
            }
          }
        }

        if (validate) {
          if (Object.keys(invalidFields).length) {
            return invalidFields;
          }

          return true;
        } else {
          return entityWithId;
        }
      },
    },
  },
};

export default RequestMixin;
