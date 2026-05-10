import {db} from '../db/index';

export async function appendPublishLog(input: {
  campaignId?: string | null;
  platform: string;
  httpStatus: number | null;
  requestPayload?: unknown;
  responsePayload?: unknown;
}): Promise<void> {
  await db
    .insertInto('publishLogs')
    .values({
      campaignId: input.campaignId ?? null,
      platform: input.platform,
      httpStatus: input.httpStatus,
      requestPayload: input.requestPayload as any,
      responsePayload: input.responsePayload as any,
      createdAt: new Date(),
    })
    .execute();
}
