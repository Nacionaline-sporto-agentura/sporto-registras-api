'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';

import RequestMixin from '../../mixins/request.mixin';
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
} from '../../types';
import { SN_TYPES_SPORTTYPES, SportType } from '../types/sportTypes/index.service';
import {
  SN_SPORTSBASES_SPACES_BUILDINGPURPOSES,
  SportBaseSpaceBuildingPurpose,
} from '../types/sportsBases/spaces/buildingsPurposes.service';
import { SN_SPORTSBASES_SPACES_ENERGYCLASSES } from '../types/sportsBases/spaces/energyClasses.service';
import { FieldTypes } from '../types/sportsBases/spaces/fields.service';
import { SN_SPORTSBASES_SPACES_TYPES } from '../types/sportsBases/spaces/types.service';
import {
  SN_SPORTSBASES_SPACES_TYPESANDFIELDS,
  SportBaseSpaceTypeAndField,
} from '../types/sportsBases/spaces/typesAndFields.service';
import { SN_SPORTSBASES_TECHNICALCONDITIONS } from '../types/sportsBases/technicalConditions.service';
import { SportsBasesType } from '../types/sportsBases/types.service';
import { SN_SPORTSBASES, SportsBase } from './index.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  technicalCondition: any;
  type: SportsBasesType['id'];
  sportTypes: SportType['id'][];
  sportBase: SportsBase;
  buildingNumber: string;
  buildingPurpose: SportBaseSpaceBuildingPurpose['id'];
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
  sportTypes: SportType[];
  buildingPurpose: SportBaseSpaceBuildingPurpose;
}

export type SportBaseSpace<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

export const SN_SPORTSBASES_SPACES = 'sportsBases.spaces';

@Service({
  name: SN_SPORTSBASES_SPACES,
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
          action: `${SN_SPORTSBASES_TECHNICALCONDITIONS}.resolve`,
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
          action: `${SN_SPORTSBASES_SPACES_TYPES}.resolve`,
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
          action: `${SN_TYPES_SPORTTYPES}.resolve`,
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
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      buildingPurpose: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseSpaceBuildingPurposeId',
        immutable: true,
        required: true,
        populate: {
          action: `${SN_SPORTSBASES_SPACES_BUILDINGPURPOSES}.resolve`,
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
      buildingArea: 'number',
      energyClass: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseSpaceEnergyClassId',
        immutable: true,
        required: true,
        populate: {
          action: `${SN_SPORTSBASES_SPACES_ENERGYCLASSES}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },
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
export default class extends moleculer.Service {
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
      const found: number = await this.broker.call(`${SN_SPORTSBASES_SPACES}.count`, {
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
      `${SN_SPORTSBASES_SPACES_TYPESANDFIELDS}.find`,
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
