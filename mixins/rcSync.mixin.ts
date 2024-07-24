'use strict';

import { readFileSync } from 'fs';
import { Context } from 'moleculer';
import xml2json from 'xml2json';

const RcSyncMixin = {
  actions: {
    getByCode(ctx: Context<{ code: string | number }>) {
      return this.findEntity(ctx, {
        query: {
          code: ctx.params.code,
        },
      });
    },
    syncData: {
      timeout: 0,
      async handler(ctx: Context) {
        const adapter = await this.getAdapter(ctx);
        const table = adapter.getTable();

        if (!this.settings?.rc) {
          throw new Error('RC options are not defined!');
        }

        try {
          await ctx.call(`${this.name}.removeAllEntities`);

          console.log('Removed all entities');

          const data = await readFileSync(process.cwd() + this.settings.rc.xmlPath, 'utf8');

          console.log('File read');

          const obj: any = xml2json.toJson(data, { object: true });

          console.log('File transformed to JSON');

          if (!this.transformRcItems || typeof this.transformRcItems !== 'function') {
            throw new Error('Function transformRcItems not defined!');
          }

          const dataToSave = this.transformRcItems(obj);

          console.log('Items transformed to array', dataToSave.length);

          const limit = 5000;
          let batchId = 1;
          const batchesCount = Math.ceil(dataToSave.length / limit);

          while (dataToSave.length > 0) {
            const batch = dataToSave.splice(0, limit);
            await table.insert(batch);
            console.log(`Syncing in progress... Batch ${batchId++} of ${batchesCount}`);
          }

          return { success: true };
        } catch (err) {
          console.error(err);
        }
      },
    },
  },
};

export default RcSyncMixin;
