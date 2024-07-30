'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../../mixins/database.mixin';
import RcSyncMixin from '../../mixins/rcSync.mixin';
import { SN_RC_ADDRESSES } from '../../types/serviceNames';
import { tableName } from '../../utils';

export interface RcAddress {
  id: number;
  name: string;
}

@Service({
  name: SN_RC_ADDRESSES,
  mixins: [
    DbConnection({
      collection: tableName(SN_RC_ADDRESSES),
      rest: false,
    }),
    RcSyncMixin,
  ],
  settings: {
    rc: {
      xmlPath: '/rc-data/addresses.xml',
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
    return items?.['ADRESAI']?.['ADRESAS']?.map((item: any) => {
      return {
        id: item?.['AOB_ID'],
        code: item?.['AOB_KODAS'],
      };
    });
  }
}
