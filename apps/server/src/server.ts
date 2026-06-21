import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";

/** Server entrypoint: load config, wire dependencies, start the worker, listen on 127.0.0.1. */
async function main(): Promise<void> {
  const config = loadConfig();
  const container = createContainer(config);
  const app = await buildApp(container, config, { logger: true });

  container.worker.start();

  const shutdown = async (): Promise<void> => {
    container.worker.stop();
    await app.close();
    container.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `Sourdex server listening on http://${config.host}:${config.port} (data: ${config.dataDir})`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
