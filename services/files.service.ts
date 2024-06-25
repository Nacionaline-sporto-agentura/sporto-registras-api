'use strict';
import mime from 'mime-types';
import { Context, default as Moleculer, default as moleculer, RestSchema } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
// @ts-ignore
import MinioMixin from 'moleculer-minio';
import {
  MultipartMeta,
  throwNoRightsError,
  throwNotFoundError,
  throwValidationError,
} from '../types';
import { SN_FILES } from '../types/serviceNames';
import { AuthUserRole, UserAuthMeta } from './api.service';

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'sporto-registras';

export enum FileTypes {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  PDF = 'application/pdf',
}

export const DefaultFileTypes: string[] = Object.values(FileTypes);

export function getExtention(mimetype: string) {
  return mime.extension(mimetype);
}

export function getMimetype(filename: string) {
  return mime.lookup(filename);
}

export function getRandomFileName(length: number = 30) {
  function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  return makeid(length);
}

@Service({
  name: SN_FILES,
  mixins: [MinioMixin],
  settings: {
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USESSL === 'true',
    accessKey: process.env.MINIO_ACCESSKEY,
    secretKey: process.env.MINIO_SECRETKEY,
  },
})
export default class extends Moleculer.Service {
  @Action({
    params: {
      bucketName: {
        type: 'string',
        optional: true,
        default: MINIO_BUCKET,
      },
      objectName: 'string',
    },
  })
  getUrl(
    ctx: Context<{
      bucketName: string;
      objectName: string;
    }>,
  ) {
    const { bucketName, objectName } = ctx.params;
    let hostUrl = process.env.MINIO_PUBLIC_URL;
    return `${hostUrl}/${bucketName}/${objectName}`;
  }
  @Action({
    rest: <RestSchema>{
      method: 'POST',
      path: '/upload',
      type: 'multipart',
      busboyConfig: {
        limits: {
          files: 1,
        },
      },
    },
  })
  async uploadFile(
    ctx: Context<
      NodeJS.ReadableStream,
      MultipartMeta & { private: string; tenant?: string; user?: string } & UserAuthMeta
    >,
  ) {
    const { mimetype, filename } = ctx.meta;
    const name = getRandomFileName(50);
    const folder = this.getFolder(ctx);

    if (!DefaultFileTypes.includes(mimetype)) {
      throw new moleculer.Errors.MoleculerClientError(
        'Unsupported MIME type.',
        400,
        'UNSUPPORTED_MIMETYPE',
      );
    }
    const extension = getExtention(mimetype);
    const objectFileName = `${folder}/${name}.${extension}`;
    const bucketName = MINIO_BUCKET;

    try {
      await ctx.call(`${SN_FILES}.putObject`, ctx.params, {
        meta: {
          bucketName,
          objectName: objectFileName,
          metaData: {
            'Content-Type': mimetype,
          },
        },
      });
    } catch (_e) {
      throw new Moleculer.Errors.MoleculerClientError(
        'Unable to upload file.',
        400,
        'UNABLE_TO_UPLOAD',
      );
    }

    const { size }: { size: number } = await ctx.call(`${SN_FILES}.statObject`, {
      objectName: objectFileName,
      bucketName,
    });

    const url = await this.getObjectUrl(ctx, objectFileName);

    const response: any = {
      success: true,
      url,
      size,
      filename,
      path: `${folder}${bucketName}/${objectFileName}`,
    };

    return response;
  }

  @Action({
    rest: 'GET /:bucket/:tenant/:user/:name',
    params: {
      name: 'string',
      tenant: 'string',
      user: 'number|concert',
    },
  })
  async getFile(
    ctx: Context<
      { bucket: string; tenant: string; user: number; name: string },
      {
        $responseHeaders: any;
        $statusCode: number;
        $statusMessage: string;
        $responseType: string;
      } & UserAuthMeta
    >,
  ) {
    const { bucket, tenant, user, name } = ctx.params;

    const isAdmin = [AuthUserRole.ADMIN, AuthUserRole.SUPER_ADMIN].some(
      (_role) => ctx.meta.authUser.type,
    );
    if (!isAdmin) {
      if (tenant !== 'private' && (!!ctx.meta.profile || Number(tenant) !== ctx.meta.profile))
        throwNoRightsError();
      if (tenant === 'private' && user !== ctx.meta.profile) throwNoRightsError();
    }

    const objectName = `${tenant}/${user}/${name}`;

    try {
      const reader: NodeJS.ReadableStream = await ctx.call(`${SN_FILES}.getObject`, {
        bucketName: bucket,
        objectName,
      });

      const mimetype = getMimetype(name);
      if (mimetype) {
        ctx.meta.$responseType = mimetype;
      }

      return reader;
    } catch (err) {
      return throwNotFoundError('File not found.');
    }
  }

  /**
   * <bucket>/uploads/<file_name> - public folder
   * <bucket>/private/<user_id>/<file_name> - user private folder
   * <bucket>/<tenant_id>/<user_id>/<file_name>  - tenant private folder
   **/
  @Method
  getFolder(
    ctx: Context<
      NodeJS.ReadableStream,
      MultipartMeta & { private: string; tenant?: string; user?: string } & UserAuthMeta
    >,
  ) {
    const isPrivate = ctx.meta.$multipart.private == 'true';
    if (isPrivate) {
      const isAdmin = [AuthUserRole.SUPER_ADMIN, AuthUserRole.ADMIN]?.some(
        (role) => ctx.meta.authUser?.type === role,
      );
      const tenant = isAdmin ? ctx.meta.$multipart.tenant || '' : ctx.meta.profile;
      const user = isAdmin ? ctx.meta.$multipart.user : ctx.meta.user?.id;
      if (!user) {
        throwValidationError('No user');
      }
      return tenant ? `${tenant}/${user}` : `private/${user}`;
    }
    return 'uploads';
  }

  @Method
  async getObjectUrl(
    ctx: Context<
      NodeJS.ReadableStream,
      MultipartMeta & { private: string; tenant?: string; user?: string } & UserAuthMeta
    >,
    objectName: string,
  ) {
    const isPrivate = ctx.meta.$multipart.private == 'true';
    if (!isPrivate) {
      return await ctx.call(`${SN_FILES}.getUrl`, {
        objectName,
        bucketName: MINIO_BUCKET,
      });
    } else {
      return `${process.env.SERVER_HOST}/${this.name}/${MINIO_BUCKET}/${objectName}`;
    }
  }

  async started() {
    try {
      const bucketExists: boolean = await this.actions.bucketExists({
        bucketName: MINIO_BUCKET,
      });

      if (!bucketExists) {
        await this.actions.makeBucket({
          bucketName: MINIO_BUCKET,
        });

        await this.client.setBucketPolicy(
          MINIO_BUCKET,
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: ['*'],
                },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${MINIO_BUCKET}/uploads/*`],
              },
            ],
          }),
        );

        await this.client.setBucketLifecycle(MINIO_BUCKET, {
          Rule: [
            {
              ID: 'Expiration Rule For Temp Files',
              Status: 'Enabled',
              Filter: {
                Prefix: 'temp/*',
              },
              Expiration: {
                Days: '7',
              },
            },
          ],
        });
      }
    } catch (err) {
      this.broker.logger.fatal(err);
    }
  }

  created() {
    if (!process.env.MINIO_ACCESSKEY || !process.env.MINIO_SECRETKEY) {
      this.broker.fatal('MINIO is not configured');
    }
  }
}
