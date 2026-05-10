import {Route, Post, Tags} from '@mathfalcon/tsoa-runtime';
import {Body, ValidateBody} from '~/decorators';
import {
  forwardMetaCapi,
  forwardTikTokEvent,
} from '~/services/marketing-tracking';
import {
  MetaCapiRouteBody,
  MetaCapiRouteSchema,
  TikTokEventsRouteBody,
  TikTokEventsRouteSchema,
} from './validation';

type MetaCapiResponse = Awaited<ReturnType<typeof forwardMetaCapi>>;
type TikTokEventsResponse = Awaited<ReturnType<typeof forwardTikTokEvent>>;

@Route('marketing/tracking')
@Tags('Marketing tracking')
export class MarketingTrackingController {
  @Post('/meta-capi')
  @ValidateBody(MetaCapiRouteSchema)
  public async metaCapi(
    @Body() body: MetaCapiRouteBody,
  ): Promise<MetaCapiResponse> {
    return forwardMetaCapi({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl,
      email: body.email,
      phone: body.phone,
      currency: body.currency,
      value: body.value,
    });
  }

  @Post('/tiktok-events')
  @ValidateBody(TikTokEventsRouteSchema)
  public async tiktokEvents(
    @Body() body: TikTokEventsRouteBody,
  ): Promise<TikTokEventsResponse> {
    return forwardTikTokEvent({
      event: body.event,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl,
      timestamp: body.timestamp,
      email: body.email,
      phone: body.phone,
      value: body.value,
      currency: body.currency,
    });
  }
}
