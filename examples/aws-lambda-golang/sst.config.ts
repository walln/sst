/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aws-lambda-golang",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("MyBucket");
    new sst.aws.Function("Golang", {
      runtime: "go",
      url: true,
      link: [bucket],
      handler: "./src",
    });
  },
});
