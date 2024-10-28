/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aws-cluster-vpclink",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("MyVpc");
    const cluster = new sst.aws.Cluster("MyCluster", { vpc });
    const service = cluster.addService("MyService", {
      serviceRegistry: {
        port: 80,
      },
    });

    const api = new sst.aws.ApiGatewayV2("MyApi", { vpc });
    api.routePrivate("$default", service.nodes.cloudmapService.arn);
  },
});
