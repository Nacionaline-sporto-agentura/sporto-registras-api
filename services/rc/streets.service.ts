'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import RcSyncMixin from '../../mixins/rcSync.mixin';
import { SN_RC_STREETS } from '../../types/serviceNames';
import { tableName } from '../../utils';

export interface RcStreet {
  id: number;
  name: string;
}

@Service({
  name: SN_RC_STREETS,
  mixins: [
    DbConnection({
      collection: tableName(SN_RC_STREETS),
      rest: false,
    }),
    RcSyncMixin,
  ],
  settings: {
    rc: {
      xmlPath: '/rc-data/streets.xml',
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
    return items?.['GATVES']?.['GATVE']?.map((item: any) => {
      return {
        id: item?.['GAT_ID'],
        code: item?.['GAT_KODAS'],
      };
    });
  }
}
