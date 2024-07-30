'use strict';
import moleculer, { Context, RestSchema } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
import DbConnection, { PopulateHandlerFn } from '../../mixins/database.mixin';

import filtersMixin from 'moleculer-knex-filters';
import RequestMixin, { REQUEST_FIELDS } from '../../mixins/request.mixin';
import {
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  FieldHookCallback,
  GET_REST_ONLY_ACCESSIBLE_TO_ADMINS,
  ONLY_GET_REST_ENABLED,
  OverrideArray,
  RestrictionType,
  TENANT_FIELD,
  TYPE_ID_OR_OBJECT_WITH_ID,
  TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
  Table,
} from '../../types';
import {
  SN_COMPETITIONS_RESULTS,
  SN_SPORTSBASES,
  SN_SPORTSPERSONS,
  SN_SPORTSPERSONS_AMS_INSTRUCTORS,
  SN_SPORTSPERSONS_ATHLETES,
  SN_SPORTSPERSONS_COACHES,
  SN_SPORTSPERSONS_FAINSTRUCTORS,
  SN_SPORTSPERSONS_FASPECIALISTS,
  SN_SPORTSPERSONS_REFEREES,
  SN_TENANTS,
  SN_TENANTS_WORKRELATIONS,
  SN_TYPES_EDUCATIONAL_COMPANIES,
  SN_TYPES_SPORTTYPES,
  SN_TYPES_STUDIES_PROGRAMS,
} from '../../types/serviceNames';
import { tableName } from '../../utils';
import { RequestEntityTypes } from '../requests/index.service';
import { SportsBase } from '../sportsBases/index.service';
import { Tenant } from '../tenants/index.service';
import { EducationalCompany } from '../types/educationalCompanies.service';
import { SportType } from '../types/sportTypes/index.service';
import { TypeStudiesProgram } from '../types/studies/programs.service';
import { TenantWorkRelations } from '../types/tenants/workRelations.service';
import { SportsPersonAmsInstructor } from './amsInstructors.service';
import { SportsPersonAthlete } from './athletes.service';
import { SportsPersonCoach } from './coaches.service';
import { SportsPersonFaInstructor } from './faInstructors.service';
import { SportsPersonFaSpecialist } from './faSpecialists.service';
import { SportsPersonsReferees } from './referees.service';

export enum StudiesType {
  LEARNING = 'LEARNING',
  STUDIES = 'STUDIES',
}

interface Fields extends CommonFields {
  id: number;
  firstName: string;
  lastName: string;
  personalCode: string;
  sportTypes: Array<SportType['id']>;
  nationality: string;
  education: Array<{
    type: StudiesType;
    company: EducationalCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }>;
  workRelations: Array<{
    organization: Tenant['id'];
    basis: TenantWorkRelations['id'];
    startAt: Date;
    endAt: Date;
  }>;
  studies: Array<{
    type: StudiesType;
    company: EducationalCompany['id'];
    program: TypeStudiesProgram['id'];
    startAt: Date;
    endAt: Date;
  }>;
  sportsBases: Array<SportsBase['id']>;
  competitionsCount: number;
  athlete: SportsPersonAthlete['id'];
  coach: SportsPersonCoach['id'];
  faInstructor: SportsPersonFaInstructor['id'];
  amsInstructor: SportsPersonAmsInstructor['id'];
  faSpecialist: SportsPersonFaSpecialist['id'];
  referee: SportsPersonsReferees['id'];
}

interface Populates extends CommonPopulates {
  sportTypes: SportType[];
  education: OverrideArray<
    Fields['education'],
    { company: EducationalCompany; program: TypeStudiesProgram }
  >;
  workRelations: OverrideArray<
    Fields['workRelations'],
    { organization: Tenant; basis: TenantWorkRelations }
  >;
  studies: OverrideArray<
    Fields['studies'],
    { company: EducationalCompany; program: TypeStudiesProgram }
  >;
  sportsBases: SportsBase[];
  athlete: SportsPersonAthlete;
  coach: SportsPersonCoach;
  faInstructor: SportsPersonFaInstructor;
  faSpecialist: SportsPersonFaSpecialist;
  amsInstructor: SportsPersonAmsInstructor;
  referee: SportsPersonsReferees;
}

export type SportsPerson<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;

@Service({
  name: SN_SPORTSPERSONS,
  mixins: [
    DbConnection({
      collection: tableName(SN_SPORTSPERSONS),
    }),
    RequestMixin,
    filtersMixin(),
  ],
  settings: {
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      firstName: 'string',
      lastName: 'string',
      personalCode: 'string',
      sportTypes: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        columnType: 'json',
        required: true,
        populate: {
          action: `${SN_TYPES_SPORTTYPES}.resolve`,
          params: {
            fields: 'id,name',
          },
        },
      },
      nationality: 'string',
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: Object.values(StudiesType),
            },
            company: TYPE_ID_OR_OBJECT_WITH_ID,
            program: TYPE_ID_OR_OBJECT_WITH_ID,
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_EDUCATIONAL_COMPANIES}.resolve`,
          program: `${SN_TYPES_STUDIES_PROGRAMS}.resolve`,
        }),
      },
      workRelations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            organization: TYPE_ID_OR_OBJECT_WITH_ID,
            basis: TYPE_ID_OR_OBJECT_WITH_ID,
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          organization: `${SN_TENANTS}.resolve`,
          basis: `${SN_TENANTS_WORKRELATIONS}.resolve`,
        }),
      },
      studies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: Object.values(StudiesType),
            },
            company: TYPE_ID_OR_OBJECT_WITH_ID,
            program: TYPE_ID_OR_OBJECT_WITH_ID,
            startAt: 'date',
            endAt: 'date',
          },
        },
        populate: PopulateHandlerFn({
          company: `${SN_TYPES_EDUCATIONAL_COMPANIES}.resolve`,
          program: `${SN_TYPES_STUDIES_PROGRAMS}.resolve`,
        }),
      },
      sportsBases: {
        ...TYPE_MULTI_ID_OR_OBJECT_WITH_ID,
        populate: `${SN_SPORTSBASES}.resolve`,
      },
      athlete: {
        type: 'number',
        columnName: 'athleteId',
        populate: {
          action: `${SN_SPORTSPERSONS_ATHLETES}.resolve`,
          params: {
            populate: ['coaches'],
            sort: 'id',
          },
        },
        requestHandler: {
          service: SN_SPORTSPERSONS_ATHLETES,
        },
      },
      coach: {
        type: 'number',
        columnName: 'coachId',
        populate: {
          action: `${SN_SPORTSPERSONS_COACHES}.resolve`,
          params: {
            populate: ['sportsBases', 'nationalTeams', 'workRelations', 'competences', 'studies'],
            sort: 'id',
          },
        },
        requestHandler: {
          service: SN_SPORTSPERSONS_COACHES,
        },
      },
      faInstructor: {
        type: 'number',
        columnName: 'faInstructorId',
        populate: {
          action: `${SN_SPORTSPERSONS_FAINSTRUCTORS}.resolve`,
          params: {
            populate: ['faSpecialists'],
            sort: 'id',
          },
        },
        requestHandler: {
          service: SN_SPORTSPERSONS_FAINSTRUCTORS,
        },
      },
      amsInstructor: {
        type: 'number',
        columnName: 'amsInstructorId',
        populate: {
          action: `${SN_SPORTSPERSONS_AMS_INSTRUCTORS}.resolve`,
          params: {
            populate: [],
            sort: 'id',
          },
        },
        requestHandler: {
          service: SN_SPORTSPERSONS_AMS_INSTRUCTORS,
        },
      },
      faSpecialist: {
        type: 'number',
        columnName: 'faSpecialistId',
        populate: {
          action: `${SN_SPORTSPERSONS_FASPECIALISTS}.resolve`,
          params: {
            populate: [],
            sort: 'id',
          },
        },
        requestHandler: {
          service: SN_SPORTSPERSONS_FASPECIALISTS,
        },
      },
      referee: {
        type: 'number',
        columnName: 'refereeId',
        populate: {
          action: `${SN_SPORTSPERSONS_REFEREES}.resolve`,
          params: {
            populate: ['categories', 'studies'],
            sort: 'id',
          },
        },
        requestHandler: {
          service: SN_SPORTSPERSONS_REFEREES,
        },
      },
      competitionsCount: {
        type: 'number',
        virtual: true,
        readonly: true,
        async get({ ctx, entity }: FieldHookCallback) {
          return ctx.call(`${SN_COMPETITIONS_RESULTS}.count`, {
            query: {
              $raw: {
                condition: `sports_persons @> ?`,
                bindings: [entity.id],
              },
            },
          });
        },
      },
      ...REQUEST_FIELDS(RequestEntityTypes.SPORTS_PERSONS),
      ...TENANT_FIELD,
      ...COMMON_FIELDS,
    },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
    scopes: { ...COMMON_SCOPES },
  },
  actions: { ...ONLY_GET_REST_ENABLED, ...GET_REST_ONLY_ACCESSIBLE_TO_ADMINS },
})
export default class extends moleculer.Service {
  @Action({
    rest: 'GET /:id/base',
    params: {
      id: 'number|convert',
    },
  })
  base(ctx: Context<{ id: SportsPerson['id'] }>) {
    return this.resolveEntities(ctx, {
      id: ctx.params.id,
      populate: [
        'lastRequest',
        'canCreateRequest',
        'sportTypes',
        'education',
        'workRelations',
        'studies',
        'sportsBases',
        'athlete',
        'coach',
        'faInstructor',
        'faSpecialist',
        'referee',
      ],
    });
  }

  @Action({
    rest: <RestSchema>{
      method: 'GET',
      basePath: '/public/sportsPersons',
      path: '/',
    },
    auth: RestrictionType.PUBLIC,
  })
  async publicSportsPersons(ctx: Context<{ id: string }>) {
    const sportsPersonTypes = [
      'athlete',
      'coach',
      'referee',
      'amsInstructor',
      'faInstructor',
      'faSpecialist',
    ];

    const sportsPersons: SportsPerson<'sportTypes'>[] = await this.findEntities(ctx, {
      ...ctx.params,
      fields: ['sportTypes', ...sportsPersonTypes],
      populate: ['sportTypes'],
    });

    const data = sportsPersons.reduce((acc, sportsPerson) => {
      sportsPerson.sportTypes.forEach(({ name }) => {
        if (!acc[name]) {
          acc[name] = { sportTypeName: name };
        }

        sportsPersonTypes.forEach((type) => {
          if (sportsPerson[type as keyof SportsPerson]) {
            acc[name][type] = (acc[name][type] || 0) + 1;
          }
        });
      });
      return acc;
    }, {} as { [key: string]: any });

    return Object.values(data);
  }
}
