/// <reference path="./.sst/platform/config.d.ts" />

import path from "path";

/**
 * ## AWS Redis local
 *
 * In this example, we use a local Docker Redis instance for dev. While on deploy, we are
 * using AWS ElastiCache.
 *
 * We use the [`docker run` cli](https://docs.docker.com/reference/cli/docker/container/run/)
 * to create a local container with Redis when running `sst dev`.
 *
 * ```ts title="sst.config.ts"
 * {
 *   command: `docker run \
 *     --rm \
 *     -p 6379:6379 \
 *     -v ${path.join(process.cwd(), ".sst", "storage", $app.stage, "MyRedis")}:/data \
 *     redis:latest`,
 * }
 * ```
 *
 * The data is persisted to the `.sst/storage` directory. So if you restart the dev server,
 * the data will still be there.
 *
 * Note that the local Redis server is running in `standalone` mode, whereas on deploy it
 * will be in `cluster` mode. Our Lambda function needs to connect using the corresponding
 * configuration.
 *
 * ```ts title="index.ts"
 * const client = Resource.MyRedis.host === "localhost"
 *   ? new Redis({
 *       host: Resource.MyRedis.host,
 *       port: Resource.MyRedis.port,
 *     })
 *   : new Cluster(
 *       [
 *         {
 *           host: Resource.MyRedis.host,
 *           port: Resource.MyRedis.port,
 *         },
 *       ],
 *       {
 *         redisOptions: {
 *           tls: {
 *             checkServerIdentity: () => undefined,
 *           },
 *           username: Resource.MyRedis.username,
 *           password: Resource.MyRedis.password,
 *         },
 *       },
 *     );
 * ```
 */
export default $config({
  app(input) {
    return {
      name: "aws-redis-local",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    // NAT Gateways are required for Lambda functions
    const vpc = new sst.aws.Vpc("MyVpc", { nat: "managed" });
    const redis = new sst.aws.Redis("MyRedis", {
      dev: {
        command: `docker run \
          --rm \
          -p 6379:6379 \
          -v ${path.join(process.cwd(), ".sst", "storage", $app.stage, "MyRedis")}:/data \
          redis:latest`,
      },
      vpc,
    });
    new sst.aws.Function("MyApp", {
      handler: "index.handler",
      url: true,
      vpc,
      link: [redis],
    });
  },
});
