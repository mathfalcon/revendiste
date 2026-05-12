import {diag, DiagConsoleLogger, DiagLogLevel} from '@opentelemetry/api';
import {ExportResultCode, type ExportResult} from '@opentelemetry/core';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-http';
import {
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import type {LogRecordExporter} from '@opentelemetry/sdk-logs';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {
  POSTHOG_KEY,
  NODE_ENV,
  POSTHOG_OTEL_DEBUG,
  POSTHOG_OTLP_LOGS_URL,
} from '~/config/env';

let sdk: NodeSDK | null = null;

function wrapLogExporterForDebug(inner: LogRecordExporter): LogRecordExporter {
  return {
    export(logRecords, resultCallback) {
      inner.export(logRecords, (result: ExportResult) => {
        if (result.code !== ExportResultCode.SUCCESS) {
          console.error('[PostHog OTel] OTLP log export failed', {
            code: result.code,
            error: result.error,
            batchSize: logRecords.length,
          });
        } else if (logRecords.length > 0) {
          console.error(
            `[PostHog OTel] OTLP log export OK (${logRecords.length} record(s))`,
          );
        }
        resultCallback(result);
      });
    },
    shutdown() {
      return inner.shutdown();
    },
  };
}

export function initOtel(serviceName = 'revendiste-backend'): void {
  // Local dev: never ship logs to PostHog (use NODE_ENV=development if you need to test ingest locally)
  if (NODE_ENV === 'local') return;
  if (!POSTHOG_KEY) return;

  if (POSTHOG_OTEL_DEBUG) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  // PostHog HTTP log ingest (see https://posthog.com/docs/logs/installation — `/i/v1/logs`, not `/otlp/v1/logs`)
  const logsUrl = POSTHOG_OTLP_LOGS_URL ?? 'https://us.i.posthog.com/i/v1/logs';

  const baseExporter = new OTLPLogExporter({
    url: logsUrl,
    headers: {
      Authorization: `Bearer ${POSTHOG_KEY}`,
    },
  });

  const exporter = POSTHOG_OTEL_DEBUG
    ? wrapLogExporterForDebug(baseExporter)
    : baseExporter;

  const logRecordProcessor = POSTHOG_OTEL_DEBUG
    ? new SimpleLogRecordProcessor(exporter)
    : new BatchLogRecordProcessor(exporter);

  if (POSTHOG_OTEL_DEBUG) {
    const keyHint =
      POSTHOG_KEY.length <= 12 ? '(short)' : `${POSTHOG_KEY.slice(0, 8)}…`;
    console.error('[PostHog OTel] debug init', {
      serviceName,
      logsUrl,
      keyHint,
      processor: 'SimpleLogRecordProcessor',
    });
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': serviceName,
      'deployment.environment': NODE_ENV,
    }),
    // Only ship logs to PostHog — omitting these registers default OTLP trace/metrics to localhost:4318
    spanProcessors: [],
    metricReaders: [],
    logRecordProcessors: [logRecordProcessor],
  });

  sdk.start();

  if (POSTHOG_OTEL_DEBUG) {
    console.error(
      '[PostHog OTel] NodeSDK started (global LoggerProvider registered)',
    );
  }
}

export async function shutdownOtel(): Promise<void> {
  if (sdk) {
    if (POSTHOG_OTEL_DEBUG) {
      console.error('[PostHog OTel] shutting down (flush export queue)');
    }
    await sdk.shutdown();
  }
}
