'use strict';
import { Context, default as Moleculer } from 'moleculer';
import { Action, Event, Service } from 'moleculer-decorators';
import { ServerClient } from 'postmark';
import { EntityChangedParams } from '../types';
import { SN_MAIL, SN_USERS } from '../types/serviceNames';
import {
  Request,
  RequestEntityTypes,
  RequestStatus,
  StatusReadable,
} from './requests/index.service';
import { User } from './users.service';

@Service({
  name: SN_MAIL,
  settings: {
    from: process.env.MAIL_FROM,
  },
})
export default class extends Moleculer.Service {
  @Action()
  async sendEmailForUser(ctx: Context<{ request: Request }>) {
    const { request } = ctx.params;

    const adminStatuses = [RequestStatus.CREATED, RequestStatus.SUBMITTED];
    const userStatuses = [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.RETURNED];
    const statusesToSendEmail = [...adminStatuses, ...userStatuses];

    if (!statusesToSendEmail.includes(request.status)) {
      return { success: false };
    }

    const forAdmin = adminStatuses.includes(request.status);

    let actionUrl, requestType;

    if (request.entityType === RequestEntityTypes.SPORTS_BASES) {
      actionUrl = request.entity
        ? `${process.env.APP_HOST}/sporto-bazes/${request.entity}`
        : `${process.env.APP_HOST}/sporto-bazes/naujas?prasymas=${request.id}`;
      requestType = 'sporto bazės';
    } else if (request.entityType === RequestEntityTypes.TENANTS) {
      actionUrl = forAdmin
        ? `${process.env.APP_HOST}/organizacijos/${request.entity}/nariai`
        : `${process.env.APP_HOST}/mano-organizacija`;

      requestType = 'organizacijos';
    }

    if (!actionUrl || !requestType) {
      this.logger.warn(
        `Cannot send email about status change because entityType not implemented :${request.entityType}`,
      );
      return { success: false };
    }

    let email: string;

    if (adminStatuses.includes(request.status)) {
      email = 'sportoregistras@ltusportas.lt';
    } else if (userStatuses.includes(request.status)) {
      const user: User = await ctx.call(`${SN_USERS}.resolve`, { id: request.createdBy });
      email = user.email;
    }

    if (!email) {
      this.logger.warn(`Cannot send email about status change because email is not provided`);
      return { success: false };
    }

    return this.client.sendEmailWithTemplate({
      From: this.settings.from,
      To: email,
      TemplateAlias: 'prasymoPakeitimai',
      TemplateModel: {
        title: StatusReadable[request.status],
        titleText: StatusReadable[request.status].toLowerCase(),
        requestType,
        actionUrl,
      },
    });
  }

  @Event()
  async 'requests.updated'(ctx: Context<EntityChangedParams<Request>>) {
    const { oldData, data } = ctx.params;

    if (data.status !== oldData.status) {
      return ctx.call(`${SN_MAIL}.sendEmailForUser`, { request: data });
    }
  }

  @Event()
  async 'requests.created'(ctx: Context<EntityChangedParams<Request>>) {
    const { data } = ctx.params;

    return ctx.call(`${SN_MAIL}.sendEmailForUser`, { request: data });
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
