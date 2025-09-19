// Tracing, metrics exporters, OTEL
// OpenTelemetry configuration
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from "@opentelemetry/sdk-metrics";

const sdk = new NodeSDK({
   traceExporter: new ConsoleSpanExporter(),
   metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
   }),
});

export function startObservability() {
   sdk.start();
   console.log("Observability SDK started.");
}

process.on("SIGTERM", () => {
   sdk.shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
});
