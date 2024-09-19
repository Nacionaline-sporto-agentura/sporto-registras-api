'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';

import { RestrictionType } from '../../types';

import {
  SN_PUBLIC,
  SN_PUBLIC_ORGANIZATIONS,
  SN_PUBLIC_SPORTS_BASES,
} from '../../types/serviceNames';

@Service({
  name: SN_PUBLIC,
  settings: {
    auth: RestrictionType.PUBLIC,
  },
})
export default class extends moleculer.Service {
  @Action({
    rest: 'GET /count',
  })
  async count(ctx: Context) {
    const sportsBasesCount = await ctx.call(`${SN_PUBLIC_SPORTS_BASES}.count`);
    const organizationsCount = await ctx.call(`${SN_PUBLIC_ORGANIZATIONS}.count`);
    return {
      sportsBases: sportsBasesCount,
      organizations: organizationsCount,
    };
  }
}
