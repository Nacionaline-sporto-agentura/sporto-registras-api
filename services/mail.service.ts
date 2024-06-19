'use strict';
import { Context, default as Moleculer } from 'moleculer';
import { Event, Service } from 'moleculer-decorators';
import { ServerClient } from 'postmark';
import { EntityChangedParams } from '../types';
import {
  Request,
  RequestEntityTypes,
  RequestStatus,
  StatusReadable,
} from './requests/index.service';
import { SN_USERS, User } from './users.service';

export const SN_MAIL = 'mail';

@Service({
  name: SN_MAIL,
  settings: {
    from: process.env.MAIL_FROM,
  },
})
export default class extends Moleculer.Service {
  @Event()
  async 'requests.updated'(ctx: Context<EntityChangedParams<Request>>) {
    const { oldData, data } = ctx.params;

    if (data.status !== oldData.status) {
      switch (data.status) {
        // Inform "Request" creator about relevant status change
        case RequestStatus.APPROVED:
        case RequestStatus.REJECTED:
        case RequestStatus.RETURNED:
          let actionUrl, requestType;

          switch (data.entityType) {
            case RequestEntityTypes.SPORTS_BASES:
              actionUrl = data.entity
                ? `${process.env.APP_HOST}/sporto-bazes/${data.entity}`
                : `${process.env.APP_HOST}/sporto-bazes/naujas?prasymas=${data.id}`;

              requestType = 'sporto bazės';

              break;

            case RequestEntityTypes.SPORTS_BASES:
              actionUrl = `${process.env.APP_HOST}/mano-organizacija`;
              requestType = 'organizacijos';
              break;

            default:
              this.logger.warn(
                `Cannot send email to Request creator about status change because entityType not implemented :${data.entityType}`,
              );
              return;
          }

          const user: User = await ctx.call(`${SN_USERS}.resolve`, { id: data.createdBy });

          if (!user.email) {
            return;
          }

          this.client.sendEmailWithTemplate({
            From: this.settings.from,
            To: user.email,
            TemplateAlias: 'prasymoPakeitimai',
            TemplateModel: {
              title: StatusReadable[data.status],
              titleText: StatusReadable[data.status].toLowerCase(),
              requestType,
              actionUrl,
            },
          });
          break;
      }
    }
  }

  created() {
    if (['production'].includes(process.env.NODE_ENV)) {
      if (!process.env.POSTMARK_KEY) {
        this.broker.fatal('POSTMARK is not configured');
      }

      this.client = new ServerClient(process.env.POSTMARK_KEY);
    } else {
      this.client = {
        sendEmailWithTemplate: (...args: unknown[]) => console.log('Sending email', ...args),
      };
    }
  }
}
