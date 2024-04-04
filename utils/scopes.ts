import { Context } from 'moleculer';
import { UserAuthMeta } from '../services/api.service';
import { UserType } from '../services/users.service';

export const VISIBLE_TO_CREATOR_OR_ADMIN_SCOPE = {
  names: ['visibleToCreatorOrAdminScope'],
  scopes: {
    visibleToCreatorOrAdminScope(query: any, ctx: Context<null, UserAuthMeta>, params: any) {
      const { user, profile } = ctx?.meta;
      if (!user?.id) return query;

      const createdByUserQuery = {
        createdBy: user?.id,
        tenant: { $exists: false },
      };

      if (profile?.id) {
        return { ...query, tenant: profile.id };
      } else if (user.type === UserType.USER) {
        return { ...query, ...createdByUserQuery };
      }

      return query;
    },
  },
};
