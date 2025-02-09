import {
  ComponentResourceOptions,
  Output,
  all,
  interpolate,
  output,
} from "@pulumi/pulumi";
import { Component, Prettify, transform } from "../component.js";
import { dns as awsDns } from "./dns.js";
import { VisibleError } from "../error.js";
import { DnsValidatedCertificate } from "./dns-validated-certificate.js";
import { Link } from "../link.js";
import {
  Cluster,
  ClusterServiceArgs,
  ClusterVpcsNormalizedArgs,
  createExecutionRole,
  createTaskDefinition,
  createTaskRole,
  normalizeArchitecture,
  normalizeContainers,
  normalizeCpu,
  normalizeMemory,
  normalizeStorage,
} from "./cluster.js";
import { URL_UNAVAILABLE } from "./linkable.js";
import {
  appautoscaling,
  ec2,
  ecs,
  getRegionOutput,
  iam,
  lb,
  servicediscovery,
} from "@pulumi/aws";
import { Vpc } from "./vpc.js";
import { DevCommand } from "../experimental/dev-command.js";
import { toSeconds } from "../duration.js";

export interface ServiceArgs extends ClusterServiceArgs {
  /**
   * The cluster to use for the service.
   */
  cluster: Cluster;
  /**
   * The VPC to use for the cluster.
   */
  vpc: Vpc | Output<Prettify<ClusterVpcsNormalizedArgs>>;
}

/**
 * The `Service` component is internally used by the `Cluster` component to deploy services to
 * [Amazon ECS](https://aws.amazon.com/ecs/). It uses [AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html).
 *
 * :::note
 * This component is not meant to be created directly.
 * :::
 *
 * This component is returned by the `addService` method of the `Cluster` component.
 */
export class Service extends Component implements Link.Linkable {
  private readonly _service?: ecs.Service;
  private readonly cloudmapNamespace?: Output<string>;
  private readonly cloudmapService?: servicediscovery.Service;
  private readonly executionRole?: iam.Role;
  private readonly taskRole: iam.Role;
  private readonly taskDefinition?: Output<ecs.TaskDefinition>;
  private readonly loadBalancer?: lb.LoadBalancer;
  private readonly autoScalingTarget?: appautoscaling.Target;
  private readonly domain?: Output<string | undefined>;
  private readonly _url?: Output<string>;
  private readonly devUrl?: Output<string>;
  private readonly dev: boolean;

  constructor(
    name: string,
    args: ServiceArgs,
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);

    const self = this;
    const clusterArn = args.cluster.nodes.cluster.arn;
    const clusterName = args.cluster.nodes.cluster.name;
    const region = getRegionOutput({}, opts).name;
    const dev = normalizeDev();
    const architecture = normalizeArchitecture(args);
    const cpu = normalizeCpu(args);
    const memory = normalizeMemory(cpu, args);
    const storage = normalizeStorage(args);
    const containers = normalizeContainers("service", args, name, architecture);
    const lbArgs = normalizeLoadBalancer();
    const scaling = normalizeScaling();
    const capacity = normalizeCapacity();
    const vpc = normalizeVpc();

    const taskRole = createTaskRole(name, args, opts, self, !!dev);

    this.dev = !!dev;
    this.cloudmapNamespace = vpc.cloudmapNamespaceName;
    this.taskRole = taskRole;

    if (dev) {
      this.devUrl = !lbArgs ? undefined : dev.url;
      registerReceiver();
      return;
    }

    const executionRole = createExecutionRole(name, args, opts, self);
    const taskDefinition = createTaskDefinition(
      name,
      args,
      opts,
      self,
      containers,
      architecture,
      cpu,
      memory,
      storage,
      taskRole,
      executionRole,
    );
    const certificateArn = createSsl();
    const loadBalancer = createLoadBalancer();
    const targetGroups = createTargets();
    createListeners();
    const cloudmapService = createCloudmapService();
    const service = createService();
    const autoScalingTarget = createAutoScaling();
    createDnsRecords();

    this._service = service;
    this.cloudmapService = cloudmapService;
    this.executionRole = executionRole;
    this.taskDefinition = taskDefinition;
    this.loadBalancer = loadBalancer;
    this.autoScalingTarget = autoScalingTarget;
    this.domain = lbArgs?.domain
      ? lbArgs.domain.apply((domain) => domain?.name)
      : output(undefined);
    this._url = !self.loadBalancer
      ? undefined
      : all([self.domain, self.loadBalancer?.dnsName]).apply(
          ([domain, loadBalancer]) =>
            domain ? `https://${domain}/` : `http://${loadBalancer}`,
        );

    this.registerOutputs({ _hint: this._url });
    registerReceiver();

    function normalizeDev() {
      if (!$dev) return undefined;
      if (args.dev === false) return undefined;

      return {
        url: output(args.dev?.url ?? URL_UNAVAILABLE),
      };
    }

    function normalizeVpc() {
      // "vpc" is a Vpc component
      if (args.vpc instanceof Vpc) {
        const vpc = args.vpc;
        return {
          isSstVpc: true,
          id: vpc.id,
          loadBalancerSubnets: lbArgs?.pub.apply((v) =>
            v ? vpc.publicSubnets : vpc.privateSubnets,
          ),
          containerSubnets: vpc.publicSubnets,
          securityGroups: vpc.securityGroups,
          cloudmapNamespaceId: vpc.nodes.cloudmapNamespace.id,
          cloudmapNamespaceName: vpc.nodes.cloudmapNamespace.name,
        };
      }

      // "vpc" is object
      return output(args.vpc).apply((vpc) => ({ isSstVpc: false, ...vpc }));
    }

    function normalizeScaling() {
      return all([lbArgs?.type, args.scaling]).apply(([type, v]) => {
        if (type !== "application" && v?.requestCount)
          throw new VisibleError(
            `Request count scaling is only supported for http/https protocols.`,
          );

        return {
          min: v?.min ?? 1,
          max: v?.max ?? 1,
          cpuUtilization: v?.cpuUtilization ?? 70,
          memoryUtilization: v?.memoryUtilization ?? 70,
          requestCount: v?.requestCount ?? false,
        };
      });
    }

    function normalizeCapacity() {
      if (!args.capacity) return;

      return output(args.capacity).apply((v) => {
        if (v === "spot")
          return { spot: { weight: 1 }, fargate: { weight: 0 } };
        return v;
      });
    }

    function normalizeLoadBalancer() {
      const loadBalancer = ((args.loadBalancer ??
        args.public) as typeof args.loadBalancer)!;
      if (!loadBalancer) return;

      // normalize rules
      const rules = all([loadBalancer, containers]).apply(
        ([lb, containers]) => {
          // validate rules
          const lbRules = lb.rules ?? lb.ports;
          if (!lbRules || lbRules.length === 0)
            throw new VisibleError(
              `You must provide the ports to expose via "loadBalancer.rules".`,
            );

          // validate container defined when multiple containers exists
          if (containers.length > 1) {
            lbRules.forEach((v) => {
              if (!v.container)
                throw new VisibleError(
                  `You must provide a container name in "loadBalancer.rules" when there is more than one container.`,
                );
            });
          }

          // parse protocols and ports
          const rules = lbRules.map((v) => {
            const listenParts = v.listen.split("/");
            const listenPort = parseInt(listenParts[0]);
            const listenProtocol = listenParts[1];
            const listenConditions =
              v.conditions || v.path
                ? {
                    path: v.conditions?.path ?? v.path,
                    query: v.conditions?.query,
                  }
                : undefined;
            if (protocolType(listenProtocol) === "network" && listenConditions)
              throw new VisibleError(
                `Invalid rule conditions for listen protocol "${v.listen}". Only "http" protocols support conditions.`,
              );

            const redirectParts = v.redirect?.split("/");
            const redirectPort = redirectParts && parseInt(redirectParts[0]);
            const redirectProtocol = redirectParts && redirectParts[1];
            if (redirectPort && redirectProtocol) {
              if (
                protocolType(listenProtocol) !== protocolType(redirectProtocol)
              )
                throw new VisibleError(
                  `The listen protocol "${v.listen}" must match the redirect protocol "${v.redirect}".`,
                );
              return {
                type: "redirect" as const,
                listenPort,
                listenProtocol,
                listenConditions,
                redirectPort,
                redirectProtocol,
              };
            }

            const forwardParts = v.forward ? v.forward.split("/") : listenParts;
            const forwardPort = forwardParts && parseInt(forwardParts[0]);
            const forwardProtocol = forwardParts && forwardParts[1];
            if (protocolType(listenProtocol) !== protocolType(forwardProtocol))
              throw new VisibleError(
                `The listen protocol "${v.listen}" must match the forward protocol "${v.forward}".`,
              );
            return {
              type: "forward" as const,
              listenPort,
              listenProtocol,
              listenConditions,
              forwardPort,
              forwardProtocol,
              container: v.container ?? containers[0].name,
            };
          });

          // validate protocols are consistent
          const appProtocols = rules.filter(
            (rule) => protocolType(rule.listenProtocol) === "application",
          );
          if (appProtocols.length > 0 && appProtocols.length < rules.length)
            throw new VisibleError(
              `Protocols must be either all http/https, or all tcp/udp/tcp_udp/tls.`,
            );

          // validate certificate exists for https/tls protocol
          rules.forEach((rule) => {
            if (["https", "tls"].includes(rule.listenProtocol) && !lb.domain) {
              throw new VisibleError(
                `You must provide a custom domain for ${rule.listenProtocol.toUpperCase()} protocol.`,
              );
            }
          });

          return rules;
        },
      );

      // normalize domain
      const domain = output(loadBalancer).apply((lb) => {
        if (!lb.domain) return undefined;

        // normalize domain
        const domain =
          typeof lb.domain === "string" ? { name: lb.domain } : lb.domain;
        return {
          name: domain.name,
          aliases: domain.aliases ?? [],
          dns: domain.dns === false ? undefined : domain.dns ?? awsDns(),
          cert: domain.cert,
        };
      });

      // normalize type
      const type = output(rules).apply((rules) =>
        rules[0].listenProtocol.startsWith("http") ? "application" : "network",
      );

      // normalize public/private
      const pub = output(loadBalancer).apply((lb) => lb?.public ?? true);

      // normalize health check
      const health = all([type, rules, loadBalancer]).apply(
        ([type, rules, lb]) =>
          Object.fromEntries(
            Object.entries(lb?.health ?? {}).map(([k, v]) => {
              if (
                !rules.find(
                  (r) => `${r.forwardPort}/${r.forwardProtocol}` === k,
                )
              )
                throw new VisibleError(
                  `Cannot configure health check for "${k}". Make sure it is defined in "loadBalancer.ports".`,
                );
              return [
                k,
                {
                  path: v.path ?? "/",
                  interval: v.interval ? toSeconds(v.interval) : 30,
                  timeout: v.timeout
                    ? toSeconds(v.timeout)
                    : type === "application"
                      ? 5
                      : 6,
                  healthyThreshold: v.healthyThreshold ?? 5,
                  unhealthyThreshold: v.unhealthyThreshold ?? 2,
                  matcher: v.successCodes ?? "200",
                },
              ];
            }),
          ),
      );

      return { type, rules, domain, pub, health };
    }

    function createLoadBalancer() {
      if (!lbArgs) return;

      const securityGroup = new ec2.SecurityGroup(
        ...transform(
          args?.transform?.loadBalancerSecurityGroup,
          `${name}LoadBalancerSecurityGroup`,
          {
            description: "Managed by SST",
            vpcId: vpc.id,
            egress: [
              {
                fromPort: 0,
                toPort: 0,
                protocol: "-1",
                cidrBlocks: ["0.0.0.0/0"],
              },
            ],
            ingress: [
              {
                fromPort: 0,
                toPort: 0,
                protocol: "-1",
                cidrBlocks: ["0.0.0.0/0"],
              },
            ],
          },
          { parent: self },
        ),
      );

      return new lb.LoadBalancer(
        ...transform(
          args.transform?.loadBalancer,
          `${name}LoadBalancer`,
          {
            internal: lbArgs.pub.apply((v) => !v),
            loadBalancerType: lbArgs.type,
            subnets: vpc.loadBalancerSubnets,
            securityGroups: [securityGroup.id],
            enableCrossZoneLoadBalancing: true,
          },
          { parent: self },
        ),
      );
    }

    function createTargets() {
      if (!loadBalancer || !lbArgs) return;

      return all([lbArgs.rules, lbArgs.health]).apply(([rules, health]) => {
        const targets: Record<string, lb.TargetGroup> = {};

        rules.forEach((r) => {
          if (r.type !== "forward") return;

          const container = r.container;
          const forwardProtocol = r.forwardProtocol.toUpperCase();
          const forwardPort = r.forwardPort;
          const targetId = `${container}${forwardProtocol}${forwardPort}`;
          const target =
            targets[targetId] ??
            new lb.TargetGroup(
              ...transform(
                args.transform?.target,
                `${name}Target${targetId}`,
                {
                  // TargetGroup names allow for 32 chars, but an 8 letter suffix
                  // ie. "-1234567" is automatically added.
                  // - If we don't specify "name" or "namePrefix", we need to ensure
                  //   the component name is less than 24 chars. Hard to guarantee.
                  // - If we specify "name", we need to ensure the $app-$stage-$name
                  //   if less than 32 chars. Hard to guarantee.
                  // - Hence we will use "namePrefix".
                  namePrefix: forwardProtocol,
                  port: forwardPort,
                  protocol: forwardProtocol,
                  targetType: "ip",
                  vpcId: vpc.id,
                  healthCheck: health[`${r.forwardPort}/${r.forwardProtocol}`],
                },
                { parent: self },
              ),
            );
          targets[targetId] = target;
        });
        return targets;
      });
    }

    function createListeners() {
      if (!lbArgs || !loadBalancer || !targetGroups) return;

      return all([lbArgs.rules, targetGroups, certificateArn]).apply(
        ([rules, targets, cert]) => {
          // Group listeners by protocol and port
          // Because listeners with the same protocol and port but different path
          // are just rules of the same listener.
          const listenersById: Record<string, typeof rules> = {};
          rules.forEach((r) => {
            const listenProtocol = r.listenProtocol.toUpperCase();
            const listenPort = r.listenPort;
            const listenerId = `${listenProtocol}${listenPort}`;
            listenersById[listenerId] = listenersById[listenerId] ?? [];
            listenersById[listenerId].push(r);
          });

          // Create listeners
          return Object.entries(listenersById).map(([listenerId, rules]) => {
            const listenProtocol = rules[0].listenProtocol.toUpperCase();
            const listenPort = rules[0].listenPort;
            const defaultRule = rules.find((r) => !r.listenConditions);
            const customRules = rules.filter((r) => r.listenConditions);
            const buildActions = (r?: (typeof rules)[number]) => [
              ...(!r
                ? [
                    {
                      type: "fixed-response",
                      fixedResponse: {
                        statusCode: "403",
                        contentType: "text/plain",
                        messageBody: "Forbidden",
                      },
                    },
                  ]
                : []),
              ...(r?.type === "forward"
                ? [
                    {
                      type: "forward",
                      targetGroupArn:
                        targets[
                          `${r.container}${r.forwardProtocol.toUpperCase()}${
                            r.forwardPort
                          }`
                        ].arn,
                    },
                  ]
                : []),
              ...(r?.type === "redirect"
                ? [
                    {
                      type: "redirect",
                      redirect: {
                        port: r.redirectPort.toString(),
                        protocol: r.redirectProtocol.toUpperCase(),
                        statusCode: "HTTP_301",
                      },
                    },
                  ]
                : []),
            ];
            const listener = new lb.Listener(
              ...transform(
                args.transform?.listener,
                `${name}Listener${listenerId}`,
                {
                  loadBalancerArn: loadBalancer.arn,
                  port: listenPort,
                  protocol: listenProtocol,
                  certificateArn: ["HTTPS", "TLS"].includes(listenProtocol)
                    ? cert
                    : undefined,
                  defaultActions: buildActions(defaultRule),
                },
                { parent: self },
              ),
            );

            customRules.forEach(
              (r) =>
                new lb.ListenerRule(
                  `${name}Listener${listenerId}Rule${
                    r.listenConditions!.path ?? ""
                  }${r.listenConditions!.query ?? ""}`,
                  {
                    listenerArn: listener.arn,
                    actions: buildActions(r),
                    conditions: [
                      {
                        pathPattern: r.listenConditions!.path
                          ? { values: [r.listenConditions!.path!] }
                          : undefined,
                        queryStrings: r.listenConditions!.query,
                      },
                    ],
                  },
                  { parent: self },
                ),
            );

            return listener;
          });
        },
      );
    }

    function createSsl() {
      if (!lbArgs) return output(undefined);

      return lbArgs.domain.apply((domain) => {
        if (!domain) return output(undefined);
        if (domain.cert) return output(domain.cert);

        return new DnsValidatedCertificate(
          `${name}Ssl`,
          {
            domainName: domain.name,
            alternativeNames: domain.aliases,
            dns: domain.dns!,
          },
          { parent: self },
        ).arn;
      });
    }

    function createCloudmapService() {
      return new servicediscovery.Service(
        `${name}CloudmapService`,
        {
          name: `${name}.${$app.stage}.${$app.name}`,
          namespaceId: vpc.cloudmapNamespaceId,
          forceDestroy: true,
          dnsConfig: {
            namespaceId: vpc.cloudmapNamespaceId,
            dnsRecords: [
              ...(args.serviceRegistry ? [{ ttl: 60, type: "SRV" }] : []),
              { ttl: 60, type: "A" },
            ],
          },
        },
        { parent: self },
      );
    }

    function createService() {
      return new ecs.Service(
        ...transform(
          args.transform?.service,
          `${name}Service`,
          {
            name,
            cluster: clusterArn,
            taskDefinition: taskDefinition.arn,
            desiredCount: scaling.min,
            ...(capacity
              ? {
                  // setting `forceNewDeployment` ensures that the service is not recreated
                  // when the capacity provider config changes.
                  forceNewDeployment: true,
                  capacityProviderStrategies: capacity.apply((v) => [
                    ...(v.fargate
                      ? [
                          {
                            capacityProvider: "FARGATE",
                            base: v.fargate?.base,
                            weight: v.fargate?.weight,
                          },
                        ]
                      : []),
                    ...(v.spot
                      ? [
                          {
                            capacityProvider: "FARGATE_SPOT",
                            base: v.spot?.base,
                            weight: v.spot?.weight,
                          },
                        ]
                      : []),
                  ]),
                }
              : // @deprecated do not use `launchType`, set `capacityProviderStrategies`
                // to `[{ capacityProvider: "FARGATE", weight: 1 }]` instead
                {
                  launchType: "FARGATE",
                }),
            networkConfiguration: {
              // If the vpc is an SST vpc, services are automatically deployed to the public
              // subnets. So we need to assign a public IP for the service to be accessible.
              assignPublicIp: vpc.isSstVpc,
              subnets: vpc.containerSubnets,
              securityGroups: vpc.securityGroups,
            },
            deploymentCircuitBreaker: {
              enable: true,
              rollback: true,
            },
            loadBalancers:
              lbArgs &&
              all([lbArgs.rules, targetGroups!]).apply(([rules, targets]) =>
                Object.values(targets).map((target) => ({
                  targetGroupArn: target.arn,
                  containerName: target.port.apply(
                    (port) =>
                      rules.find((r) => r.forwardPort === port)!.container!,
                  ),
                  containerPort: target.port.apply((port) => port!),
                })),
              ),
            enableExecuteCommand: true,
            serviceRegistries: {
              registryArn: cloudmapService.arn,
              port: args.serviceRegistry
                ? output(args.serviceRegistry).port
                : undefined,
            },
          },
          { parent: self },
        ),
      );
    }

    function createAutoScaling() {
      const target = new appautoscaling.Target(
        ...transform(
          args.transform?.autoScalingTarget,
          `${name}AutoScalingTarget`,
          {
            serviceNamespace: "ecs",
            scalableDimension: "ecs:service:DesiredCount",
            resourceId: interpolate`service/${clusterName}/${service.name}`,
            maxCapacity: scaling.max,
            minCapacity: scaling.min,
          },
          { parent: self },
        ),
      );

      output(scaling.cpuUtilization).apply((cpuUtilization) => {
        if (cpuUtilization === false) return;
        new appautoscaling.Policy(
          `${name}AutoScalingCpuPolicy`,
          {
            serviceNamespace: target.serviceNamespace,
            scalableDimension: target.scalableDimension,
            resourceId: target.resourceId,
            policyType: "TargetTrackingScaling",
            targetTrackingScalingPolicyConfiguration: {
              predefinedMetricSpecification: {
                predefinedMetricType: "ECSServiceAverageCPUUtilization",
              },
              targetValue: cpuUtilization,
            },
          },
          { parent: self },
        );
      });

      output(scaling.memoryUtilization).apply((memoryUtilization) => {
        if (memoryUtilization === false) return;
        new appautoscaling.Policy(
          `${name}AutoScalingMemoryPolicy`,
          {
            serviceNamespace: target.serviceNamespace,
            scalableDimension: target.scalableDimension,
            resourceId: target.resourceId,
            policyType: "TargetTrackingScaling",
            targetTrackingScalingPolicyConfiguration: {
              predefinedMetricSpecification: {
                predefinedMetricType: "ECSServiceAverageMemoryUtilization",
              },
              targetValue: memoryUtilization,
            },
          },
          { parent: self },
        );
      });

      all([scaling.requestCount, targetGroups]).apply(
        ([requestCount, targetGroups]) => {
          if (requestCount === false) return;
          if (!targetGroups) return;

          const targetGroup = Object.values(targetGroups)[0];

          new appautoscaling.Policy(
            `${name}AutoScalingRequestCountPolicy`,
            {
              serviceNamespace: target.serviceNamespace,
              scalableDimension: target.scalableDimension,
              resourceId: target.resourceId,
              policyType: "TargetTrackingScaling",
              targetTrackingScalingPolicyConfiguration: {
                predefinedMetricSpecification: {
                  predefinedMetricType: "ALBRequestCountPerTarget",
                  resourceLabel: all([
                    loadBalancer?.arn,
                    targetGroup.arn,
                  ]).apply(([loadBalancerArn, targetGroupArn]) => {
                    // arn:...:loadbalancer/app/frank-MyServiceLoadBalan/005af2ad12da1e52
                    // => app/frank-MyServiceLoadBalan/005af2ad12da1e52
                    const lbPart = loadBalancerArn
                      ?.split(":")
                      .pop()
                      ?.split("/")
                      .slice(1)
                      .join("/");
                    // arn:...:targetgroup/HTTP20250103004618450100000001/e0811b8cf3a60762
                    // => targetgroup/HTTP20250103004618450100000001
                    const tgPart = targetGroupArn?.split(":").pop();
                    return `${lbPart}/${tgPart}`;
                  }),
                },
                targetValue: requestCount,
              },
            },
            { parent: self },
          );
        },
      );

      return target;
    }

    function createDnsRecords() {
      if (!lbArgs) return;

      lbArgs.domain.apply((domain) => {
        if (!domain?.dns) return;

        for (const recordName of [domain.name, ...domain.aliases]) {
          const namePrefix =
            recordName === domain.name ? name : `${name}${recordName}`;
          domain.dns.createAlias(
            namePrefix,
            {
              name: recordName,
              aliasName: loadBalancer!.dnsName,
              aliasZone: loadBalancer!.zoneId,
            },
            { parent: self },
          );
        }
      });
    }

    function registerReceiver() {
      all([containers]).apply(([val]) => {
        for (const container of val) {
          const title = val.length == 1 ? name : `${name}${container.name}`;
          new DevCommand(`${title}Dev`, {
            link: args.link,
            dev: {
              title,
              autostart: true,
              directory: (() => {
                if (!container.image) return "";
                if (typeof container.image === "string") return "";
                if (container.image.context) return container.image.context;
                return "";
              })(),
              ...container.dev,
            },
            environment: {
              ...container.environment,
              AWS_REGION: region,
            },
            aws: {
              role: taskRole.arn,
            },
          });
        }
      });
    }
  }

  /**
   * The URL of the service.
   *
   * If `public.domain` is set, this is the URL with the custom domain.
   * Otherwise, it's the autogenerated load balancer URL.
   */
  public get url() {
    const errorMessage =
      "Cannot access the URL because no public ports are exposed.";
    if (this.dev) {
      if (!this.devUrl) throw new VisibleError(errorMessage);
      return this.devUrl;
    }

    if (!this._url) throw new VisibleError(errorMessage);
    return this._url;
  }

  /**
   * The name of the Cloud Map service. This is useful for service discovery.
   */
  public get service() {
    return this.dev
      ? interpolate`dev.${this.cloudmapNamespace}`
      : interpolate`${this.cloudmapService!.name}.${this.cloudmapNamespace}`;
  }

  /**
   * The underlying [resources](/docs/components/#nodes) this component creates.
   */
  public get nodes() {
    const self = this;
    return {
      /**
       * The Amazon ECS Service.
       */
      get service() {
        if (self.dev)
          throw new VisibleError("Cannot access `nodes.service` in dev mode.");
        return self._service!;
      },
      /**
       * The Amazon ECS Execution Role.
       */
      executionRole: this.executionRole,
      /**
       * The Amazon ECS Task Role.
       */
      taskRole: this.taskRole,
      /**
       * The Amazon ECS Task Definition.
       */
      get taskDefinition() {
        if (self.dev)
          throw new VisibleError(
            "Cannot access `nodes.taskDefinition` in dev mode.",
          );
        return self.taskDefinition!;
      },
      /**
       * The Amazon Elastic Load Balancer.
       */
      get loadBalancer() {
        if (self.dev)
          throw new VisibleError(
            "Cannot access `nodes.loadBalancer` in dev mode.",
          );
        if (!self.loadBalancer)
          throw new VisibleError(
            "Cannot access `nodes.loadBalancer` when no public ports are exposed.",
          );
        return self.loadBalancer;
      },
      /**
       * The Amazon Application Auto Scaling target.
       */
      get autoScalingTarget() {
        if (self.dev)
          throw new VisibleError(
            "Cannot access `nodes.autoScalingTarget` in dev mode.",
          );
        return self.autoScalingTarget!;
      },
      /**
       * The Amazon Cloud Map service.
       */
      get cloudmapService() {
        if (self.dev)
          throw new VisibleError(
            "Cannot access `nodes.cloudmapService` in dev mode.",
          );
        return self.cloudmapService!;
      },
    };
  }

  /** @internal */
  public getSSTLink() {
    return {
      properties: {
        url: this.dev ? this.devUrl : this._url,
        service: this.service,
      },
    };
  }
}

function protocolType(protocol: string) {
  return ["http", "https"].includes(protocol)
    ? ("application" as const)
    : ("network" as const);
}

const __pulumiType = "sst:aws:Service";
// @ts-expect-error
Service.__pulumiType = __pulumiType;
