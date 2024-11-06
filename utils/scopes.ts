import { Context } from 'moleculer';
import { UserAuthMeta } from '../services/api.service';
import { UserType } from '../services/users.service';
import { SN_TENANTUSERS } from '../types/serviceNames';

export const VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE = {
  names: ['visibleToCreatorOrAdminScope'],
  scopes: {
    async visibleToCreatorOrAdminScope(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
      const { user, profile } = ctx?.meta;
      if (!user?.id) return query;

      const createdByUserQuery = {
        createdBy: user.id,
        tenant: { $exists: false },
      };

      if (profile?.id) {
        const tenantsIds: number[] = await ctx.call(`${SN_TENANTUSERS}.findIdsByUserRecursive`, {
          id: user.id,
          tenant: profile.id,
        });

        return { ...query, tenant: { $in: tenantsIds } };
      } else if (user.type === UserType.USER) {
        return { ...query, ...createdByUserQuery };
      }

      return query;
    },
  },
};
