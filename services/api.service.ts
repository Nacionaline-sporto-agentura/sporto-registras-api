'use strict';

import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import ApiGateway from 'moleculer-web';
import {
  COMMON_DELETED_SCOPES,
  RequestMessage,
  RestrictionType,
  throwUnauthorizedError,
} from '../types';
import { SN_API, SN_AUTH, SN_TENANTUSERS, SN_USERS } from '../types/serviceNames';
import { Tenant } from './tenants/index.service';
import { User } from './users.service';

export interface UserAuthMeta {
  user: User;
  app: { id: number };
  authToken: string;
  authUser: any;
  profile: any;
}

export enum AuthUserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Service({
  name: SN_API,
  mixins: [ApiGateway],
  // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
  // TODO: helmet
  settings: {
    port: process.env.PORT || 3000,

    // Global CORS settings for all routes
    cors: {
      // Configures the Access-Control-Allow-Origin CORS header.
      origin: '*',
      // Configures the Access-Control-Allow-Methods CORS header.
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
      // Configures the Access-Control-Allow-Headers CORS header.
      allowedHeaders: '*',
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600,
    },

    use: [
      function (req: any, _res: any, next: any) {
        const removeScopes = (query: any) => {
          if (!query) return query;

          if (typeof query !== 'object') {
            try {
              query = JSON.parse(query);
            } catch (err) {}
          }

          if (!query || typeof query !== 'object') return query;

          if (query.scope === 'deleted') {
            query.scope = COMMON_DELETED_SCOPES.join(',');
          } else {
            delete query.scope;
          }

          return query;
        };

        req.query = removeScopes(req.query);
        req.body = removeScopes(req.body);

        next();
      },
    ],

    routes: [
      {
        path: '/api',
        whitelist: [
          // Access to any actions in all services under "/api" URL
          '**',
        ],

        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: true,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: true,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: '1MB',
          },
          urlencoded: {
            extended: true,
            limit: '1MB',
          },
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: 'all', // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true,
      },
    ],
    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    log4XXResponses: false,
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    logRequestParams: null,
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    logResponseData: null,
    // Serve assets from "public" folder
    assets: {
      folder: 'public',
      // Options to `server-static` module
      options: {},
    },
  },

  actions: {
    listAliases: {
      rest: null,
    },
  },
})
export default class extends moleculer.Service {
  @Action({
    auth: RestrictionType.PUBLIC,
    rest: {
      method: 'GET',
      path: '/ping',
      basePath: '/',
    },
  })
  ping() {
    return {
      timestamp: Date.now(),
    };
  }

  @Action({
    rest: {
      method: 'POST',
      path: '/cache/clean',
      basePath: '/',
    },
    auth: RestrictionType.PUBLIC,
  })
  cleanCache() {
    this.broker.cacher.clean();
  }

  @Method
  getRestrictionType(req: RequestMessage) {
    return req.$action.auth || req.$action.service?.settings?.auth || RestrictionType.DEFAULT;
  }

  @Method
  async authenticate(
    ctx: Context<Record<string, unknown>, UserAuthMeta>,
    _route: any,
    req: RequestMessage,
  ): Promise<unknown> {
    const restrictionType = this.getRestrictionType(req);

    if (restrictionType === RestrictionType.PUBLIC) {
      return null;
    }

    // Read the token from header
    const auth = req.headers.authorization;
    if (!auth?.startsWith?.('Bearer')) {
      throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null);
    }

    const token = auth.slice(7);

    // it will throw error if token not valid
    const authUser: any = await ctx.call(`${SN_AUTH}.users.resolveToken`, null, {
      meta: { authToken: token },
    });

    const app: any = await ctx.call(`${SN_AUTH}.apps.resolveToken`);

    const user: User = await ctx.call(`${SN_USERS}.resolveByAuthUser`, {
      authUser,
    });

    ctx.meta.authUser = authUser;
    ctx.meta.authToken = token;
    ctx.meta.app = app;

    const profile = req.headers['x-profile'];

    if (profile) {
      const tenantWithRole: Tenant = await ctx.call(`${SN_TENANTUSERS}.getProfile`, {
        id: user.id,
        profile,
      });

      if (!tenantWithRole) {
        throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null);
      }

      ctx.meta.profile = tenantWithRole;
    }

    return user;
  }

  @Method
  async authorize(
    ctx: Context<Record<string, unknown>, UserAuthMeta>,
    _route: any,
    req: RequestMessage,
  ): Promise<unknown> {
    const restrictionType = this.getRestrictionType(req);

    if (restrictionType === RestrictionType.PUBLIC) {
      return;
    }

    const aAuth = Array.isArray(req.$action.auth) ? req.$action.auth : [req.$action.auth];
    const oAuth = Array.isArray(req.$route.opts.auth)
      ? req.$route.opts.auth
      : [req.$route.opts.auth];

    const allAuth = [...aAuth, ...oAuth].filter(Boolean);
    const auth = [...new Set(allAuth)];
    const valid = await ctx.call(`${SN_AUTH}.validateType`, { auth });

    if (!valid) {
      return throwUnauthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
    }
  }
}
