'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import RequestMixin from '../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  TYPE_ID_OR_OBJECT_WITH_ID,
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
  Table,
  throwValidationError,
} from '../types';
import { SportsBasesBuildingType } from './sportsBases.buildingTypes.service';
import { SportsBase } from './sportsBases.service';
import { FieldTypes } from './sportsBases.spaces.fields.service';
import { SportBaseSpaceSportType } from './sportsBases.spaces.sportTypes.service';
import { SportBaseSpaceTypeAndField } from './sportsBases.spaces.typesAndFields.service';
import { SportsBasesSpacesTypesAndFieldsValues } from './sportsBases.spaces.typesAndFields.values.service';
import { SportsBasesType } from './sportsBases.types.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  technicalCondition: any;
  type: SportsBasesType['id'];
  sportTypes: SportBaseSpaceSportType['id'][];
  sportBase: SportsBase;
  buildingType: SportsBasesBuildingType['id'];
  buildingNumber: string;
  buildingPurpose: string;
  buildingArea: number;
  energyClass: number;
  constructionDate: Date;
  latestRenovationDate: Date;
  energyClassCertificate: {
    url: string;
    name: string;
    size: number;
  };
}

interface Populates extends CommonPopulates {
  technicalCondition: any;
  type: SportsBasesType;
  sportTypes: SportBaseSpaceSportType[];
  buildingType: SportsBasesBuildingType;
}

export type SportBaseSpace<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: 'sportsBases.spaces',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpaces',
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
      technicalCondition: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'technicalConditionId',
        immutable: true,
        required: true,
        populate: {
          action: 'sportsBases.technicalConditions.resolve',
          params: {
            fields: 'id,name',
          },
        },
      },
      type: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'typeId',
        immutable: true,
        optional: true,
        populate: {
          action: 'sportsBases.spaces.types.resolve',
          params: {
            fields: 'id,type,name',
          },
        },
      },
      sportTypes: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        columnType: 'json',
        required: true,
        populate: {
          action: 'sportsBases.spaces.sportTypes.resolve',
          params: {
            fields: 'id,name',
          },
        },
      },
      sportBase: {
        type: 'number',
        columnName: 'sportBaseId',
        immutable: true,
        optional: true,
        populate: 'sportsBases.resolve',
      },
      buildingType: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'buildingTypeId',
        immutable: true,
        required: true,
        populate: {
          action: 'sportsBases.buildingTypes.resolve',
          params: {
            fields: 'id,name',
          },
        },
      },
      buildingNumber: {
        type: 'string',
        required: true,
        validate: 'validateBuildingNumber',
      },
      buildingPurpose: 'string',
      buildingArea: 'number',
      energyClass: 'string',
      energyClassCertificate: {
        type: 'object',
        properties: {
          url: 'string|required',
          name: 'string',
          size: 'number',
        },
      },
      constructionDate: 'date',
      latestRenovationDate: 'date',

      photos: {
        type: 'array',
        validate: 'validatePhotos',
        min: 1,
        items: {
          type: 'object',
          properties: {
            url: 'string|required',
            description: 'string|required',
            representative: {
              type: 'boolean',
              required: false,
              default: false,
            },
            public: {
              type: 'boolean',
              required: false,
              default: false,
            },
          },
        },
      },
      name: 'string',
      additionalValues: {
        virtual: true,
        type: 'object',
        async populate(ctx: any, _values: any, sportsBasesSpaces: any[]) {
          const values: SportsBasesSpacesTypesAndFieldsValues[] = await ctx.call(
            'sportsBases.spaces.typesAndFields.values.find',
            {
              query: {
                sportBaseSpace: {
                  $in: sportsBasesSpaces.map((sportBaseSpace) => sportBaseSpace.id),
                },
              },
            },
          );

          const mappedValues = values.reduce((acc, curr) => {
            acc[curr.sportBaseSpace] = acc[curr.sportBaseSpace] || {};

            acc[curr.sportBaseSpace][curr.typeAndField] = curr.value;

            return acc;
          }, {} as any);

          return sportsBasesSpaces.map((sportBaseSpace) => mappedValues[sportBaseSpace.id]);
        },
      },
      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
  hooks: {
    before: {
      remove: ['beforeRemove'],
    },
  },
})
export default class SportsBasesService extends moleculer.Service {
  @Action()
  async create(
    ctx: Context<{
      additionalValues?: { [key: number]: any };
      [key: string]: any;
    }>,
  ) {
    const { additionalValues, ...rest } = ctx.params;

    const typesAndFields: SportBaseSpaceTypeAndField[] = await ctx.call(
      'sportsBases.spaces.typesAndFields.find',
      {
        query: { type: rest?.type },
        populate: 'field',
      },
    );

    const values = this.getAdditionalFields({
      typeAndField: typesAndFields,
      additionalValues,
    });

    const sportBaseSpace: SportBaseSpace = await this.createEntity(ctx, rest);

    await ctx.call(
      'sportsBases.spaces.typesAndFields.values.createMany',
      values.map((value) => ({ ...value, sportBaseSpace: sportBaseSpace.id })),
    );

    return { success: true };
  }

  @Action()
  async update(
    ctx: Context<{
      id: number;
      additionalValues?: { [key: number]: any };
      [key: string]: any;
    }>,
  ) {
    const { id, additionalValues, ...rest } = ctx.params;

    const sportBaseSpace: SportBaseSpace = await ctx.call('sportsBases.spaces.resolve', {
      id,
      throwIfNotExist: true,
    });

    const typesAndFields: SportBaseSpaceTypeAndField[] = await ctx.call(
      'sportsBases.spaces.typesAndFields.find',
      {
        query: { type: rest?.type || sportBaseSpace.type },
        populate: 'field',
      },
    );

    const filteredTypesAndFields = typesAndFields.filter(
      (item) => typeof additionalValues?.[item.id] !== 'undefined',
    );

    const values = this.getAdditionalFields({
      typeAndField: filteredTypesAndFields,
      additionalValues,
    });

    const oldAdditionalValues: SportsBasesSpacesTypesAndFieldsValues[] = await ctx.call(
      'sportsBases.spaces.typesAndFields.values.find',
      {
        query: {
          sportBaseSpace: id,
          typeAndField: { $in: filteredTypesAndFields.map((item) => item.id) },
        },
      },
    );

    const oldAdditionalValuesIds = oldAdditionalValues.reduce(
      (acc, item) => ({ ...acc, [item.typeAndField]: item.id }),
      {} as any,
    );

    const newAdditionalValues = values.map((value) => ({
      id: oldAdditionalValuesIds[value.typeAndField],
      ...value,
      sportBaseSpace: sportBaseSpace.id,
    }));

    await this.updateEntity(ctx, { id: sportBaseSpace.id, ...rest });

    await ctx.call('sportsBases.spaces.typesAndFields.values.updateMany', newAdditionalValues);

    return { success: true };
  }

  @Method
  validatePhotos({ value }: FieldHookCallback) {
    return (
      value.filter((photo: any) => photo.representative).length === 1 ||
      'One photo must be representative'
    );
  }

  @Method
  async validateBuildingNumber({ value, entity }: FieldHookCallback) {
    if (entity?.buildingNumber !== value) {
      const found: number = await this.broker.call('sportsBases.spaces.count', {
        query: { buildingNumber: value },
      });
      if (!!found) {
        return `Sports base with buildingNumber '${value}' already exists.`;
      }
    }
    return true;
  }

  @Method
  getAdditionalFields({
    typeAndField,
    additionalValues,
  }: {
    typeAndField: SportBaseSpaceTypeAndField[];
    additionalValues: { [key: number]: any };
  }) {
    const values = typeAndField.map((item) => {
      const { title, type, scale, precision, options } = item?.field;
      const value = additionalValues?.[item.id];
      if (typeof value === 'undefined') {
        throwValidationError(`${title} is a required value`);
      } else if (type === FieldTypes.TEXT && typeof value !== 'string') {
        throwValidationError(`${title} must be a string`);
      } else if (type === FieldTypes.BOOLEAN && typeof value !== 'boolean') {
        throwValidationError(`${title} ${typeof value} must be a boolean`);
      } else if (type === FieldTypes.NUMBER) {
        if (typeof value !== 'number') {
          throwValidationError(`${title}  must be a number`);
        }

        if (!!precision && !!scale) {
          const regex = new RegExp(`^-?\\d{0,${precision - scale}}(?:\\.\\d{0,${scale}})?$`);

          if (!regex.test(value)) {
            throwValidationError(`Invalid decimal value for ${title}`);
          }
        }
      } else if (type === FieldTypes.SELECT && options.length && !options.includes(value)) {
        throwValidationError(`Invalid value for ${title}`);
      }

      return {
        value: JSON.stringify(value),
        typeAndField: item.id,
      };
    });

    return values;
  }

  @Method
  async beforeRemove(ctx: Context<{ id: number }>) {
    return await ctx.call('sportsBases.spaces.typesAndFields.values.removeMany', {
      query: {
        sportBaseSpace: ctx.params.id,
      },
    });
  }
}
