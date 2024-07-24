'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import RcSyncMixin from '../../mixins/rcSync.mixin';
import { CommonFields } from '../../types';
import { SN_RC_RESIDENTIAL_AREAS } from '../../types/serviceNames';
import { tableName } from '../../utils';

export interface RcResidentialArea extends CommonFields {
  id: number;
  name: string;
}

@Service({
  name: SN_RC_RESIDENTIAL_AREAS,
  mixins: [
    DbConnection({
      collection: tableName(SN_RC_RESIDENTIAL_AREAS),
      rest: false,
    }),
    RcSyncMixin,
  ],
  settings: {
    rc: {
      xmlPath: '/rc-data/residentialAreas.xml',
    },
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },
      code: 'number',
    },
  },
})
export default class extends moleculer.Service {
  @Method
  transformRcItems(items: { [key: string]: any }) {
    return items?.['GYVENVIETES']?.['GYVENVIETE']?.map((item: any) => {
      return {
        id: item?.['GYV_ID'],
        code: item?.['GYV_KODAS'],
      };
    });
  }
}
