/// <reference path="./.sst/platform/config.d.ts" />

/**
 * ## AWS Postgres local
 *
 * In this example, we connect to a locally running Docker Postgres instance for dev. While
 * on deploy, we are using RDS.
 *
 * We use the [`docker run` cli](https://docs.docker.com/reference/cli/docker/container/run/)
 * to start a local container with Postgres.
 *
 * ```bash
 * docker run \
 *   --rm \
 *   -p 5432:5432 \
 *   -v $(pwd)/.sst/storage/postgres:/var/lib/postgresql/data \
 *   -e POSTGRES_USER=postgres \
 *   -e POSTGRES_PASSWORD=password \
 *   -e POSTGRES_DB=postgres \
 *   postgres:16.4
 * ```
 *
 * Note tht the data is persisted to the `.sst/storage` directory. So if you restart the
 * dev server, the data will still be there.
 *
 * We then configure the `dev` property of the Postgres component with the settings for the
 * local Postgres instance. So our Lambda function will connect to this Postgres instance
 * through the link.
 *
 * ```ts title="sst.config.ts"
 * dev: {
 *   username: "postgres",
 *   password: "password",
 *   database: "postgres",
 * },
 * ```
 */
export default $config({
  app(input) {
    return {
      name: "aws-postgres-local",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("MyVpc", { bastion: true, nat: "ec2" });
    const rds = new sst.aws.Postgres("MyPostgres", {
      dev: {
        username: "postgres",
        password: "password",
        database: "postgres",
      },
      vpc,
    });
    new sst.aws.Function("MyFunction", {
      url: true,
      handler: "index.handler",
      link: [rds],
      vpc,
    });
  },
});
