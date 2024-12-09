import {
  ComponentResourceOptions,
  jsonStringify,
  Output,
  output,
} from "@pulumi/pulumi";
import { Component, Transform } from "../component";
import { Link } from "../link";
import { s3 } from "@pulumi/aws";
import { FunctionArgs, Function, Dynamo, CdnArgs, Router } from "../aws";
import { functionBuilder } from "../aws/helpers/function-builder";
import { env } from "../linkable";

export interface AuthArgs {
  authenticator: string | FunctionArgs;
  domain?: CdnArgs["domain"];
  transform?: {
    bucketPolicy?: Transform<s3.BucketPolicyArgs>;
  };
}

export class AwsAuth extends Component implements Link.Linkable {
  private readonly _authenticator: Output<Function>;
  private readonly _router?: Router;

  constructor(name: string, args: AuthArgs, opts?: ComponentResourceOptions) {
    super(__pulumiType, name, args, opts);
    const table = new Dynamo(
      `${name}Table`,
      {
        fields: {
          pk: "string",
          sk: "string",
        },
        ttl: "expiry",
        primaryIndex: {
          hashKey: "pk",
          rangeKey: "sk",
        },
      },
      {
        parent: this,
      },
    );

    this._authenticator = functionBuilder(
      `${name}Authenticator`,
      args.authenticator,
      {
        link: [table],
      },
      (args) => {
        args.url = true;
        args.environment = output(args.environment).apply((env) => ({
          ...env,
          OPENAUTH_STORAGE: jsonStringify({
            type: "dynamo",
            options: {
              table: table.name,
            },
          }),
        }));
      },
      {
        parent: this,
      },
    ).apply((v) => v.getFunction());

    if (args.domain)
      this._router = new Router(
        `${name}Router`,
        {
          domain: args.domain,
          routes: {
            "/": this._authenticator.url,
          },
        },
        { parent: this },
      );
  }

  public get authenticator() {
    return this._authenticator;
  }

  public get url() {
    return (
      this._router?.url ?? this._authenticator.url.apply((v) => v.slice(0, -1))
    );
  }

  /** @internal */
  public getSSTLink() {
    return {
      properties: {
        url: this.url,
      },
      include: [
        env({
          OPENAUTH_ISSUER: this.url,
        }),
      ],
    };
  }
}

const __pulumiType = "sst:aws:Auth";
// @ts-expect-error
AwsAuth.__pulumiType = __pulumiType;
