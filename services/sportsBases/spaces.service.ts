'use strict';
import moleculer, { Context } from 'moleculer';
import { Event, Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';

import RequestMixin from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  EntityChangedParams,
  FieldHookCallback,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  Table,
  throwValidationError,
  TYPE_ID_OR_OBJECT_WITH_ID,
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
} from '../../types';
import {
  SN_SPORTSBASES,
  SN_SPORTSBASES_SPACES,
  SN_SPORTSBASES_SPACES_GROUPS,
  SN_SPORTSBASES_SPACES_TYPES,
  SN_SPORTSBASES_SPACES_TYPESANDFIELDS,
  SN_SPORTSBASES_TECHNICALCONDITIONS,
  SN_TYPES_SPORTTYPES,
} from '../../types/serviceNames';
import { FieldTypes } from '../types/sportsBases/spaces/fields.service';
import { SportBaseSpaceType } from '../types/sportsBases/spaces/types.service';
import { SportBaseSpaceTypeAndField } from '../types/sportsBases/spaces/typesAndFields.service';
import { SportsBasesTechnicalCondition } from '../types/sportsBases/technicalConditions.service';
import { SportsBasesType } from '../types/sportsBases/types.service';
import { SportType } from '../types/sportTypes/index.service';
import { SportsBase } from './index.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  technicalCondition: SportsBasesTechnicalCondition['id'];
  type: SportsBasesType['id'];
  sportTypes: SportType['id'][];
  sportBase: SportsBase;
  buildingNumber: string;
  buildingPurpose: string;
  buildingArea: number;
  energyClass: number;
  constructionDate: string;
  latestRenovationDate: string;
  additionalValues: { [key: string]: any }[];
}

interface Populates extends CommonPopulates {
  technicalCondition: SportsBasesTechnicalCondition;
  type: SportsBasesType;
  sportTypes: SportType[];
  buildingPurpose: string;
}

export type SportBaseSpace<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

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
        required: true,
        populate: {
          action: `${SN_SPORTSBASES_TECHNICALCONDITIONS}.resolve`,
          params: {
            fields: 'id,name,color',
          },
        },
      },
      group: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseSpaceGroupId',
        optional: true,
        populate: {
          action: `${SN_SPORTSBASES_SPACES_GROUPS}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },
      type: {
        ...TYPE_ID_OR_OBJECT_WITH_ID,
        columnName: 'sportBaseSpaceTypeId',
        optional: true,
        populate: {
          action: `${SN_SPORTSBASES_SPACES_TYPES}.resolve`,
          params: {
            fields: 'id,name,needSportType',
          },
        },
      },
      sportTypes: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        columnType: 'json',
        columnName: 'sportBaseSpaceSportTypes',
        async validate({ ctx, value, entity, params }: FieldHookCallback) {
          const typeId = params.type || entity?.sportBaseSpaceTypeId;
          if (!typeId) return true;

          if (value?.length) return true;

          const item: SportBaseSpaceType = await ctx.call(
            `${SN_SPORTSBASES_SPACES_TYPES}.resolve`,
            {
              id: typeId,
              throwIfNotExist: true,
            },
          );

          if (item.needSportType && !value?.length) {
            return 'sportTypes are required!';
          }

          return true;
        },
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
        optional: true,
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      buildingPurpose: 'string',

      buildingNumber: {
        type: 'string',
        required: true,
      },
      buildingArea: 'number',
      energyClass: 'string',
      constructionDate: 'string|convert|max:4',
      latestRenovationDate: 'string|convert|max:4',

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

  @Event()
  async 'sportsBases.removed'(ctx: Context<EntityChangedParams<SportsBase>>) {
    const sportBase = ctx.params.data as SportsBase;

    await this.removeEntities(ctx, {
      query: {
        sportBase: sportBase.id,
      },
    });
  }
}
