import {NodeSDK} from '@opentelemetry/sdk-node';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-http';
import {BatchLogRecordProcessor} from '@opentelemetry/sdk-logs';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {POSTHOG_KEY, POSTHOG_HOST, NODE_ENV} from '~/config/env';

let sdk: NodeSDK | null = null;

export function initOtel(): void {
  if (!POSTHOG_KEY) return;

  const logsUrl = `${POSTHOG_HOST}/i/v1/logs`;

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': 'revendiste-backend',
      'deployment.environment': NODE_ENV,
    }),
    logRecordProcessor: new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: logsUrl,
        headers: {
          Authorization: `Bearer ${POSTHOG_KEY}`,
        },
      }),
    ),
  });

  sdk.start();
}

export async function shutdownOtel(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
