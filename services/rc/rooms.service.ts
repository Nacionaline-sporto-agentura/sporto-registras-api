'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import RcSyncMixin from '../../mixins/rcSync.mixin';
import { SN_RC_ROOMS } from '../../types/serviceNames';
import { tableName } from '../../utils';

export interface RcRoom {
  id: number;
  name: string;
}

@Service({
  name: SN_RC_ROOMS,
  mixins: [
    DbConnection({
      collection: tableName(SN_RC_ROOMS),
      rest: false,
    }),
    RcSyncMixin,
  ],
  settings: {
    rc: {
      xmlPath: '/rc-data/rooms.xml',
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
    return items?.['PATALPOS']?.['PATALPA']?.map((item: any) => {
      return {
        id: item?.['PAT_ID'],
        code: item?.['PAT_KODAS'],
      };
    });
  }
}
