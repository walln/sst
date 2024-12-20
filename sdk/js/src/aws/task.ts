import { AwsOptions, client } from "./client.js";

/**
 * The `task` client SDK is available through the following.
 *
 * @example
 * ```js title="src/app.ts"
 * import { task } from "sst/aws/task";
 * ```
 */
export module task {
  function url(region?: string, options?: AwsOptions) {
    if (options?.region) region = options.region;
    return `https://ecs.${region}.amazonaws.com/`;
  }

  /**
   * The link data for the task.
   *
   * @example
   * For example, let's say you have a task.
   *
   * ```js title="sst.config.ts"
   * cluster.addTask("MyTask");
   * ```
   *
   * `Resource.MyTask` will have all the link data.
   *
   * ```js title="src/app.ts"
   * import { Resource } from "sst";
   *
   * console.log(Resource.MyTask);
   * ```
   */
  export interface Resource {
    /**
     * The ARN of the cluster.
     */
    cluster: string;
    /**
     * The ARN of the task definition.
     */
    taskDefinition: string;
    /**
     * The subnets to use for the task.
     */
    subnets: string[];
    /**
     * The security groups to use for the task.
     */
    securityGroups: string[];
    /**
     * Whether to assign a public IP address to the task.
     */
    assignPublicIp: boolean;
    /**
     * The names of the containers in the task.
     */
    containers: string[];
  }

  export interface Options {
    /**
     * Configure the AWS client.
     */
    aws?: AwsOptions;
  }

  interface Task {
    /**
     * The ARN of the task.
     */
    arn: string;
    /**
     * The status of the task.
     */
    status: string;
  }

  export interface DescribeResponse extends Task {
    /**
     * The raw response from the AWS ECS DescribeTasks API.
     * @see [@aws-sdk/client-ecs.DescribeTasksResponse](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-ecs/Interface/DescribeTasksResponse/)
     */
    response: any;
  }

  export interface RunResponse extends Task {
    /**
     * The raw response from the AWS ECS RunTask API.
     * @see [@aws-sdk/client-ecs.RunTaskResponse](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-ecs/Interface/RunTaskResponse/)
     */
    response: any;
  }

  export interface StopResponse extends Task {
    /**
     * The raw response from the AWS ECS StopTask API.
     * @see [@aws-sdk/client-ecs.StopTaskResponse](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-ecs/Interface/StopTaskResponse/)
     */
    response: any;
  }

  /**
   * Gets the details of a task. Tasks stopped longer than 1 hour are not returned.
   * @example
   * For example, let's say you have started task.
   *
   * ```js title="src/app.ts"
   * import { Resource } from "sst";
   * import { task } from "sst/aws/task";
   *
   * const runRet = await task.run(Resource.MyTask);
   * const taskArn = runRet.tasks[0].taskArn;
   * ```
   *
   * You can get the details of the task with the following.
   *
   * ```js title="src/app.ts"
   * const describeRet = await task.describe(Resource.MyTask, taskArn);
   * ```
   */
  export async function describe(
    resource: Resource,
    task: string,
    options?: Options
  ): Promise<DescribeResponse> {
    const c = await client();
    const u = url(c.region, options?.aws);
    const res = await c.fetch(u, {
      method: "POST",
      aws: options?.aws,
      headers: {
        "X-Amz-Target": "AmazonEC2ContainerServiceV20141113.DescribeTasks",
        "Content-Type": "application/x-amz-json-1.1",
      },
      body: JSON.stringify({
        cluster: resource.cluster,
        tasks: [task],
      }),
    });
    if (!res.ok) throw new DescribeError(res);

    const data = (await res.json()) as {
      tasks?: {
        taskArn: string;
        lastStatus: string;
      }[];
    };
    if (!data.tasks?.length) throw new DescribeError(res);

    return {
      arn: data.tasks[0].taskArn,
      status: data.tasks[0].lastStatus,
      response: data,
    };
  }

  /**
   * Runs a task.
   *
   * @example
   *
   * For example, let's say you have a task.
   *
   * ```js title="sst.config.ts"
   * cluster.addTask("MyTask");
   * ```
   *
   * You can run it in your application with the following.
   *
   * ```js title="src/app.ts"
   * import { Resource } from "sst";
   * import { task } from "sst/aws/task";
   *
   * const runRet = await task.run(Resource.MyTask);
   * const taskArn = runRet.tasks[0].taskArn;
   * ```
   *
   * `taskArn` is the ARN of the task. You can pass it to the `describe` function to get
   * the status of the task; or to the `stop` function to stop the task.
   *
   * You can also pass in environment variables to the task.
   *
   * ```js title="src/app.ts"
   * await task.run(Resource.MyTask, {
   *   MY_ENV_VAR: "my-value",
   * });
   * ```
   */
  export async function run(
    resource: Resource,
    environment?: Record<string, string>,
    options?: {
      aws?: AwsOptions;
    }
  ): Promise<RunResponse> {
    const c = await client();
    const u = url(c.region, options?.aws);
    const res = await c.fetch(u, {
      method: "POST",
      aws: options?.aws,
      headers: {
        "X-Amz-Target": "AmazonEC2ContainerServiceV20141113.RunTask",
        "Content-Type": "application/x-amz-json-1.1",
      },
      body: JSON.stringify({
        cluster: resource.cluster,
        launchType: "FARGATE",
        taskDefinition: resource.taskDefinition,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: resource.subnets,
            securityGroups: resource.securityGroups,
            assignPublicIp: resource.assignPublicIp ? "ENABLED" : "DISABLED",
          },
        },
        overrides: {
          containerOverrides: resource.containers.map((name) => ({
            name,
            environment: Object.entries(environment ?? {}).map(
              ([key, value]) => ({
                name: key,
                value,
              })
            ),
          })),
        },
      }),
    });
    if (!res.ok) throw new RunError(res);

    const data = (await res.json()) as {
      tasks?: {
        taskArn: string;
        lastStatus: string;
      }[];
    };
    if (!data.tasks?.length) throw new RunError(res);

    return {
      arn: data.tasks[0].taskArn,
      status: data.tasks[0].lastStatus,
      response: data,
    };
  }

  /**
   * Stops a task.
   *
   * @example
   *
   * For example, let's say you have started a task.
   *
   * ```js title="src/app.ts"
   * import { Resource } from "sst";
   * import { task } from "sst/aws/task";
   *
   * const runRet = await task.run(Resource.MyTask);
   * const taskArn = runRet.tasks[0].taskArn;
   * ```
   *
   * You can stop the task with the following.
   *
   * ```js title="src/app.ts"
   * const stopRet = await task.stop(Resource.MyTask, taskArn);
   *
   * // check if the task is stopped
   * console.log(stopRet.task?.lastStatus);
   * ```
   */
  export async function stop(
    resource: Resource,
    task: string,
    options?: Options
  ): Promise<StopResponse> {
    const c = await client();
    const u = url(c.region, options?.aws);
    const res = await c.fetch(u, {
      method: "POST",
      aws: options?.aws,
      headers: {
        "X-Amz-Target": "AmazonEC2ContainerServiceV20141113.StopTask",
        "Content-Type": "application/x-amz-json-1.1",
      },
      body: JSON.stringify({
        cluster: resource.cluster,
        task,
      }),
    });
    if (!res.ok) throw new StopError(res);

    const data = (await res.json()) as {
      task: {
        taskArn: string;
        lastStatus: string;
      };
    };
    if (!data.task) throw new StopError(res);

    return {
      arn: data.task.taskArn,
      status: data.task.lastStatus,
      response: data,
    };
  }

  export class DescribeError extends Error {
    constructor(public readonly response: Response) {
      super("Failed to describe task");
      console.log(response);
    }
  }

  export class RunError extends Error {
    constructor(public readonly response: Response) {
      super("Failed to run task");
      console.log(response);
    }
  }
  export class StopError extends Error {
    constructor(public readonly response: Response) {
      super("Failed to stop task");
      console.log(response);
    }
  }
}
