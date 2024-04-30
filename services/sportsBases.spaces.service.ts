'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
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
import { SportsBase } from './sportsBases.service';
import { SportsBasesSpacesBuildingType } from './sportsBases.spaces.buildingTypes.service';
import { FieldTypes } from './sportsBases.spaces.fields.service';
import { SportBaseSpaceSportType } from './sportsBases.spaces.sportTypes.service';
import { SportBaseSpaceTypeAndField } from './sportsBases.spaces.typesAndFields.service';
import { SportsBasesType } from './sportsBases.types.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  technicalCondition: any;
  type: SportsBasesType['id'];
  sportTypes: SportBaseSpaceSportType['id'][];
  sportBase: SportsBase;
  buildingType: SportsBasesSpacesBuildingType['id'];
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
  buildingType: SportsBasesSpacesBuildingType;
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
        columnName: 'sportBaseTechnicalConditionId',
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
        columnName: 'sportBaseSpaceTypeId',
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
        columnName: 'sportBaseSpaceSportTypes',
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
        columnName: 'sportBaseSpaceBuildingTypeId',
        immutable: true,
        required: true,
        populate: {
          action: 'sportsBases.spaces.buildingTypes.resolve',
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
        //        validate: 'validateAdditionalValues',
        type: 'object',
      },
      ...COMMON_FIELDS,
    },

    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class SportsBasesService extends moleculer.Service {
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
  async validateAdditionalValues({
    ctx,
    value: additionalValues,
    entity,
    params,
  }: FieldHookCallback<SportBaseSpace | SportBaseSpace<'type'>>) {
    let type: SportBaseSpace['type'];
    if (typeof params?.type === 'object') {
      type = params.type.id;
    } else if (typeof params?.type === 'number') {
      type = params.type;
    } else {
      type = entity?.type;
    }

    if (!type) {
      return true;
    }

    const typesAndFields: SportBaseSpaceTypeAndField[] = await ctx.call(
      'sportsBases.spaces.typesAndFields.find',
      {
        query: { type },
        populate: 'field',
      },
    );

    for (const item of typesAndFields) {
      const { title, type, scale, precision, options } = item?.field;
      const value = additionalValues?.[item.id];
      if (typeof value === 'undefined') {
        throwValidationError(`${title} is a required value`);
      } else if (type === FieldTypes.TEXT_AREA && typeof value !== 'string') {
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
    }

    return true;
  }
}
