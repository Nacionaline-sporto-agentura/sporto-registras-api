import { Context } from 'moleculer';
import { RestrictionType } from '../types';

export function PublicActions(opts: { fields: any[]; path: string }) {
  const schema = {
    actions: {
      _publicList: {
        auth: RestrictionType.PUBLIC,
        rest: {
          method: 'GET',
          path: opts.path,
          basePath: '/public',
        } as any,
        handler(ctx: Context<{}>) {
          return this.actions.list({ ...ctx.params, fields: opts.fields });
        },
      },
      _publicGet: {
        auth: RestrictionType.PUBLIC,
        rest: {
          method: 'GET',
          path: `${opts.path}/:id`,
          basePath: '/public',
        } as any,
        params: {
          id: 'number|convert',
        },
        handler(ctx: Context<{}>) {
          return this.actions.get({ ...ctx.params, fields: opts.fields });
        },
      },
      _publicCount: {
        auth: RestrictionType.PUBLIC,
        rest: {
          method: 'GET',
          path: `${opts.path}/count`,
          basePath: '/public',
        } as any,
        handler(ctx: Context<{}>) {
          return this.actions.count({ ...ctx.params });
        },
      },
      _publicAll: {
        auth: RestrictionType.PUBLIC,
        rest: {
          method: 'GET',
          path: `${opts.path}/all`,
          basePath: '/public',
        } as any,
        handler(ctx: Context<{}>) {
          return this.actions.find({ ...ctx.params, fields: opts.fields });
        },
      },
    },
  };

  return schema;
}
