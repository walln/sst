export interface DescribeTasksRequest {
  /**
   * <p>The short name or full Amazon Resource Name (ARN) of the cluster that hosts the task or tasks to
   * 			describe. If you do not specify a cluster, the default cluster is assumed. This parameter is required. If you do not specify a
   * 			value, the <code>default</code> cluster is used.</p>
   * @public
   */
  cluster?: string | undefined;
  /**
   * <p>A list of up to 100 task IDs or full ARN entries.</p>
   * @public
   */
  tasks: string[] | undefined;
  /**
   * <p>Specifies whether you want to see the resource tags for the task. If <code>TAGS</code>
   * 			is specified, the tags are included in the response. If this field is omitted, tags
   * 			aren't included in the response.</p>
   * @public
   */
  include?: TaskField[] | undefined;
}

export interface DescribeTasksResponse {
  /**
   * <p>The list of tasks.</p>
   * @public
   */
  tasks?: Task[] | undefined;
  /**
   * <p>Any failures associated with the call.</p>
   * @public
   */
  failures?: Failure[] | undefined;
}

export interface RunTaskRequest {
  /**
   * <p>The capacity provider strategy to use for the task.</p>
   *          <p>If a <code>capacityProviderStrategy</code> is specified, the <code>launchType</code>
   * 			parameter must be omitted. If no <code>capacityProviderStrategy</code> or
   * 				<code>launchType</code> is specified, the
   * 				<code>defaultCapacityProviderStrategy</code> for the cluster is used.</p>
   *          <p>When you use cluster auto scaling, you must specify
   * 				<code>capacityProviderStrategy</code> and not <code>launchType</code>. </p>
   *          <p>A capacity provider strategy can contain a maximum of 20 capacity providers.</p>
   * @public
   */
  capacityProviderStrategy?: CapacityProviderStrategyItem[] | undefined;
  /**
   * <p>The short name or full Amazon Resource Name (ARN) of the cluster to run your task on.
   * 			If you do not specify a cluster, the default cluster is assumed.</p>
   * @public
   */
  cluster?: string | undefined;
  /**
   * <p>The number of instantiations of the specified task to place on your cluster. You can
   * 			specify up to 10 tasks for each call.</p>
   * @public
   */
  count?: number | undefined;
  /**
   * <p>Specifies whether to use Amazon ECS managed tags for the task. For more information, see
   * 				<a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-using-tags.html">Tagging Your Amazon ECS
   * 				Resources</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  enableECSManagedTags?: boolean | undefined;
  /**
   * <p>Determines whether to use the execute command functionality for the containers in this
   * 			task. If <code>true</code>, this enables execute command functionality on all containers
   * 			in the task.</p>
   *          <p>If <code>true</code>, then the task definition must have a task role, or you must
   * 			provide one as an override.</p>
   * @public
   */
  enableExecuteCommand?: boolean | undefined;
  /**
   * <p>The name of the task group to associate with the task. The default value is the family
   * 			name of the task definition (for example, <code>family:my-family-name</code>).</p>
   * @public
   */
  group?: string | undefined;
  /**
   * <p>The infrastructure to run your standalone task on. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_types.html">Amazon ECS
   * 				launch types</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   *          <p>The <code>FARGATE</code> launch type runs your tasks on Fargate On-Demand
   * 			infrastructure.</p>
   *          <note>
   *             <p>Fargate Spot infrastructure is available for use but a capacity provider
   * 				strategy must be used. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html">Fargate capacity providers</a> in the
   * 					<i>Amazon ECS Developer Guide</i>.</p>
   *          </note>
   *          <p>The <code>EC2</code> launch type runs your tasks on Amazon EC2 instances registered to your
   * 			cluster.</p>
   *          <p>The <code>EXTERNAL</code> launch type runs your tasks on your on-premises server or
   * 			virtual machine (VM) capacity registered to your cluster.</p>
   *          <p>A task can use either a launch type or a capacity provider strategy. If a
   * 				<code>launchType</code> is specified, the <code>capacityProviderStrategy</code>
   * 			parameter must be omitted.</p>
   *          <p>When you use cluster auto scaling, you must specify
   * 				<code>capacityProviderStrategy</code> and not <code>launchType</code>. </p>
   * @public
   */
  launchType?: LaunchType | undefined;
  /**
   * <p>The network configuration for the task. This parameter is required for task
   * 			definitions that use the <code>awsvpc</code> network mode to receive their own elastic
   * 			network interface, and it isn't supported for other network modes. For more information,
   * 			see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html">Task networking</a>
   * 			in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  networkConfiguration?: NetworkConfiguration | undefined;
  /**
   * <p>A list of container overrides in JSON format that specify the name of a container in
   * 			the specified task definition and the overrides it should receive. You can override the
   * 			default command for a container (that's specified in the task definition or Docker
   * 			image) with a <code>command</code> override. You can also override existing environment
   * 			variables (that are specified in the task definition or Docker image) on a container or
   * 			add new environment variables to it with an <code>environment</code> override.</p>
   *          <p>A total of 8192 characters are allowed for overrides. This limit includes the JSON
   * 			formatting characters of the override structure.</p>
   * @public
   */
  overrides?: TaskOverride | undefined;
  /**
   * <p>An array of placement constraint objects to use for the task. You can specify up to 10
   * 			constraints for each task (including constraints in the task definition and those
   * 			specified at runtime).</p>
   * @public
   */
  placementConstraints?: PlacementConstraint[] | undefined;
  /**
   * <p>The placement strategy objects to use for the task. You can specify a maximum of 5
   * 			strategy rules for each task.</p>
   * @public
   */
  placementStrategy?: PlacementStrategy[] | undefined;
  /**
   * <p>The platform version the task uses. A platform version is only specified for tasks
   * 			hosted on Fargate. If one isn't specified, the <code>LATEST</code>
   * 			platform version is used. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform_versions.html">Fargate platform
   * 				versions</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  platformVersion?: string | undefined;
  /**
   * <p>Specifies whether to propagate the tags from the task definition to the task. If no
   * 			value is specified, the tags aren't propagated. Tags can only be propagated to the task
   * 			during task creation. To add tags to a task after task creation, use the<a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_TagResource.html">TagResource</a> API action.</p>
   *          <note>
   *             <p>An error will be received if you specify the <code>SERVICE</code> option when
   * 				running a task.</p>
   *          </note>
   * @public
   */
  propagateTags?: PropagateTags | undefined;
  /**
   * <p>This parameter is only used by Amazon ECS. It is not intended for use by customers.</p>
   * @public
   */
  referenceId?: string | undefined;
  /**
   * <p>An optional tag specified when a task is started. For example, if you automatically
   * 			trigger a task to run a batch process job, you could apply a unique identifier for that
   * 			job to your task with the <code>startedBy</code> parameter. You can then identify which
   * 			tasks belong to that job by filtering the results of a <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ListTasks.html">ListTasks</a> call with
   * 			the <code>startedBy</code> value. Up to 128 letters (uppercase and lowercase), numbers,
   * 			hyphens (-), forward slash (/), and underscores (_) are allowed.</p>
   *          <p>If a task is started by an Amazon ECS service, then the <code>startedBy</code> parameter
   * 			contains the deployment ID of the service that starts it.</p>
   * @public
   */
  startedBy?: string | undefined;
  /**
   * <p>The metadata that you apply to the task to help you categorize and organize them. Each
   * 			tag consists of a key and an optional value, both of which you define.</p>
   *          <p>The following basic restrictions apply to tags:</p>
   *          <ul>
   *             <li>
   *                <p>Maximum number of tags per resource - 50</p>
   *             </li>
   *             <li>
   *                <p>For each resource, each tag key must be unique, and each tag key can have only
   *                     one value.</p>
   *             </li>
   *             <li>
   *                <p>Maximum key length - 128 Unicode characters in UTF-8</p>
   *             </li>
   *             <li>
   *                <p>Maximum value length - 256 Unicode characters in UTF-8</p>
   *             </li>
   *             <li>
   *                <p>If your tagging schema is used across multiple services and resources,
   *                     remember that other services may have restrictions on allowed characters.
   *                     Generally allowed characters are: letters, numbers, and spaces representable in
   *                     UTF-8, and the following characters: + - = . _ : / @.</p>
   *             </li>
   *             <li>
   *                <p>Tag keys and values are case-sensitive.</p>
   *             </li>
   *             <li>
   *                <p>Do not use <code>aws:</code>, <code>AWS:</code>, or any upper or lowercase
   *                     combination of such as a prefix for either keys or values as it is reserved for
   *                     Amazon Web Services use. You cannot edit or delete tag keys or values with this prefix. Tags with
   *                     this prefix do not count against your tags per resource limit.</p>
   *             </li>
   *          </ul>
   * @public
   */
  tags?: Tag[] | undefined;
  /**
   * <p>The <code>family</code> and <code>revision</code> (<code>family:revision</code>) or
   * 			full ARN of the task definition to run. If a <code>revision</code> isn't specified,
   * 			the latest <code>ACTIVE</code> revision is used.</p>
   *          <p>The full ARN value must match the value that you specified as the
   * 				<code>Resource</code> of the principal's permissions policy.</p>
   *          <p>When you specify a task definition, you must either specify a specific revision, or
   * 			all revisions in the ARN.</p>
   *          <p>To specify a specific revision, include the revision number in the ARN. For example,
   * 			to specify revision 2, use
   * 				<code>arn:aws:ecs:us-east-1:111122223333:task-definition/TaskFamilyName:2</code>.</p>
   *          <p>To specify all revisions, use the wildcard (*) in the ARN. For example, to specify
   * 			all revisions, use
   * 				<code>arn:aws:ecs:us-east-1:111122223333:task-definition/TaskFamilyName:*</code>.</p>
   *          <p>For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/security_iam_service-with-iam.html#security_iam_service-with-iam-id-based-policies-resources">Policy Resources for Amazon ECS</a> in the Amazon Elastic Container Service Developer Guide.</p>
   * @public
   */
  taskDefinition: string | undefined;
  /**
   * <p>An identifier that you provide to ensure the idempotency of the request. It must be
   * 			unique and is case sensitive. Up to 64 characters are allowed. The valid characters are
   * 			characters in the range of 33-126, inclusive. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/ECS_Idempotency.html">Ensuring idempotency</a>.</p>
   * @public
   */
  clientToken?: string | undefined;
  /**
   * <p>The details of the volume that was <code>configuredAtLaunch</code>. You can configure
   * 			the size, volumeType, IOPS, throughput, snapshot and encryption in in <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_TaskManagedEBSVolumeConfiguration.html">TaskManagedEBSVolumeConfiguration</a>. The <code>name</code> of the volume must
   * 			match the <code>name</code> from the task definition.</p>
   * @public
   */
  volumeConfigurations?: TaskVolumeConfiguration[] | undefined;
}

export interface RunTaskResponse {
  /**
   * <p>A full description of the tasks that were run. The tasks that were successfully placed
   * 			on your cluster are described here.</p>
   * @public
   */
  tasks?: Task[] | undefined;
  /**
   * <p>Any failures associated with the call.</p>
   *          <p>For information about how to address failures, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-event-messages.html#service-event-messages-list">Service event messages</a> and <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/api_failures_messages.html">API failure
   * 				reasons</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  failures?: Failure[] | undefined;
}

export interface StopTaskRequest {
  /**
   * <p>The short name or full Amazon Resource Name (ARN) of the cluster that hosts the task to stop.
   * 			If you do not specify a cluster, the default cluster is assumed.</p>
   * @public
   */
  cluster?: string | undefined;
  /**
   * <p>The task ID of the task to stop.</p>
   * @public
   */
  task: string | undefined;
  /**
   * <p>An optional message specified when a task is stopped. For example, if you're using a
   * 			custom scheduler, you can use this parameter to specify the reason for stopping the task
   * 			here, and the message appears in subsequent <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_DescribeTasks.html">DescribeTasks</a>>
   * 			API operations on this task.</p>
   * @public
   */
  reason?: string | undefined;
}

export interface StopTaskResponse {
  /**
   * <p>The task that was stopped.</p>
   * @public
   */
  task?: Task | undefined;
}

export declare const TaskField: {
  readonly TAGS: "TAGS";
};
export type TaskField = (typeof TaskField)[keyof typeof TaskField];

export interface Task {
  /**
   * <p>The Elastic Network Adapter that's associated with the task if the task uses the
   * 				<code>awsvpc</code> network mode.</p>
   * @public
   */
  attachments?: Attachment[] | undefined;
  /**
   * <p>The attributes of the task</p>
   * @public
   */
  attributes?: Attribute[] | undefined;
  /**
   * <p>The Availability Zone for the task.</p>
   * @public
   */
  availabilityZone?: string | undefined;
  /**
   * <p>The capacity provider that's associated with the task.</p>
   * @public
   */
  capacityProviderName?: string | undefined;
  /**
   * <p>The ARN of the cluster that hosts the task.</p>
   * @public
   */
  clusterArn?: string | undefined;
  /**
   * <p>The connectivity status of a task.</p>
   * @public
   */
  connectivity?: Connectivity | undefined;
  /**
   * <p>The Unix timestamp for the time when the task last went into <code>CONNECTED</code>
   * 			status.</p>
   * @public
   */
  connectivityAt?: Date | undefined;
  /**
   * <p>The ARN of the container instances that host the task.</p>
   * @public
   */
  containerInstanceArn?: string | undefined;
  /**
   * <p>The containers that's associated with the task.</p>
   * @public
   */
  containers?: Container[] | undefined;
  /**
   * <p>The number of CPU units used by the task as expressed in a task definition. It can be
   * 			expressed as an integer using CPU units (for example, <code>1024</code>). It can also be
   * 			expressed as a string using vCPUs (for example, <code>1 vCPU</code> or <code>1
   * 				vcpu</code>). String values are converted to an integer that indicates the CPU units
   * 			when the task definition is registered.</p>
   *          <p>If you use the EC2 launch type, this field is optional. Supported values
   * 			are between <code>128</code> CPU units (<code>0.125</code> vCPUs) and <code>10240</code>
   * 			CPU units (<code>10</code> vCPUs).</p>
   *          <p>If you use the Fargate launch type, this field is required. You must use
   * 			one of the following values. These values determine the range of supported values for
   * 			the <code>memory</code> parameter:</p>
   *          <p>The CPU units cannot be less than 1 vCPU when you use Windows containers on
   * 			Fargate.</p>
   *          <ul>
   *             <li>
   *                <p>256 (.25 vCPU) - Available <code>memory</code> values: 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB)</p>
   *             </li>
   *             <li>
   *                <p>512 (.5 vCPU) - Available <code>memory</code> values: 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB)</p>
   *             </li>
   *             <li>
   *                <p>1024 (1 vCPU) - Available <code>memory</code> values: 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB)</p>
   *             </li>
   *             <li>
   *                <p>2048 (2 vCPU) - Available <code>memory</code> values: 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB)</p>
   *             </li>
   *             <li>
   *                <p>4096 (4 vCPU) - Available <code>memory</code> values: 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB)</p>
   *             </li>
   *             <li>
   *                <p>8192 (8 vCPU)  - Available <code>memory</code> values: 16 GB and 60 GB in 4 GB increments</p>
   *                <p>This option requires Linux platform <code>1.4.0</code> or
   *                                         later.</p>
   *             </li>
   *             <li>
   *                <p>16384 (16vCPU)  - Available <code>memory</code> values: 32GB and 120 GB in 8 GB increments</p>
   *                <p>This option requires Linux platform <code>1.4.0</code> or
   *                                         later.</p>
   *             </li>
   *          </ul>
   * @public
   */
  cpu?: string | undefined;
  /**
   * <p>The Unix timestamp for the time when the task was created. More specifically, it's for
   * 			the time when the task entered the <code>PENDING</code> state.</p>
   * @public
   */
  createdAt?: Date | undefined;
  /**
   * <p>The desired status of the task. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-lifecycle.html">Task
   * 			Lifecycle</a>.</p>
   * @public
   */
  desiredStatus?: string | undefined;
  /**
   * <p>Determines whether execute command functionality is turned on for this task. If
   * 				<code>true</code>, execute command functionality is turned on all the containers in
   * 			the task.</p>
   * @public
   */
  enableExecuteCommand?: boolean | undefined;
  /**
   * <p>The Unix timestamp for the time when the task execution stopped.</p>
   * @public
   */
  executionStoppedAt?: Date | undefined;
  /**
   * <p>The name of the task group that's associated with the task.</p>
   * @public
   */
  group?: string | undefined;
  /**
   * <p>The health status for the task. It's determined by the health of the essential
   * 			containers in the task. If all essential containers in the task are reporting as
   * 				<code>HEALTHY</code>, the task status also reports as <code>HEALTHY</code>. If any
   * 			essential containers in the task are reporting as <code>UNHEALTHY</code> or
   * 				<code>UNKNOWN</code>, the task status also reports as <code>UNHEALTHY</code> or
   * 				<code>UNKNOWN</code>.</p>
   *          <note>
   *             <p>The Amazon ECS container agent doesn't monitor or report on Docker health checks that
   * 				are embedded in a container image and not specified in the container definition. For
   * 				example, this includes those specified in a parent image or from the image's
   * 				Dockerfile. Health check parameters that are specified in a container definition
   * 				override any Docker health checks that are found in the container image.</p>
   *          </note>
   * @public
   */
  healthStatus?: HealthStatus | undefined;
  /**
   * <p>The Elastic Inference accelerator that's associated with the task.</p>
   * @public
   */
  inferenceAccelerators?: InferenceAccelerator[] | undefined;
  /**
   * <p>The last known status for the task. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-lifecycle.html">Task
   * 				Lifecycle</a>.</p>
   * @public
   */
  lastStatus?: string | undefined;
  /**
   * <p>The infrastructure where your task runs on. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_types.html">Amazon ECS
   * 				launch types</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  launchType?: LaunchType | undefined;
  /**
   * <p>The amount of memory (in MiB) that the task uses as expressed in a task definition. It
   * 			can be expressed as an integer using MiB (for example, <code>1024</code>). If it's
   * 			expressed as a string using GB (for example, <code>1GB</code> or <code>1 GB</code>),
   * 			it's converted to an integer indicating the MiB when the task definition is
   * 			registered.</p>
   *          <p>If you use the EC2 launch type, this field is optional.</p>
   *          <p>If you use the Fargate launch type, this field is required. You must use
   * 			one of the following values. The value that you choose determines the range of supported
   * 			values for the <code>cpu</code> parameter.</p>
   *          <ul>
   *             <li>
   *                <p>512 (0.5 GB), 1024 (1 GB), 2048 (2 GB) - Available <code>cpu</code> values: 256 (.25 vCPU)</p>
   *             </li>
   *             <li>
   *                <p>1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB) - Available <code>cpu</code> values: 512 (.5 vCPU)</p>
   *             </li>
   *             <li>
   *                <p>2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB) - Available <code>cpu</code> values: 1024 (1 vCPU)</p>
   *             </li>
   *             <li>
   *                <p>Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB) - Available <code>cpu</code> values: 2048 (2 vCPU)</p>
   *             </li>
   *             <li>
   *                <p>Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB) - Available <code>cpu</code> values: 4096 (4 vCPU)</p>
   *             </li>
   *             <li>
   *                <p>Between 16 GB and 60 GB in 4 GB increments - Available <code>cpu</code> values: 8192 (8 vCPU)</p>
   *                <p>This option requires Linux platform <code>1.4.0</code> or
   *                                         later.</p>
   *             </li>
   *             <li>
   *                <p>Between 32GB and 120 GB in 8 GB increments - Available <code>cpu</code> values: 16384 (16 vCPU)</p>
   *                <p>This option requires Linux platform <code>1.4.0</code> or
   *                                         later.</p>
   *             </li>
   *          </ul>
   * @public
   */
  memory?: string | undefined;
  /**
   * <p>One or more container overrides.</p>
   * @public
   */
  overrides?: TaskOverride | undefined;
  /**
   * <p>The platform version where your task runs on. A platform version is only specified for
   * 			tasks that use the Fargate launch type. If you didn't specify one, the
   * 				<code>LATEST</code> platform version is used. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform_versions.html">Fargate Platform Versions</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  platformVersion?: string | undefined;
  /**
   * <p>The operating system that your tasks are running on. A platform family is specified
   * 			only for tasks that use the Fargate launch type. </p>
   *          <p> All tasks that run as part of this service must use the same
   * 				<code>platformFamily</code> value as the service (for example,
   * 			<code>LINUX.</code>).</p>
   * @public
   */
  platformFamily?: string | undefined;
  /**
   * <p>The Unix timestamp for the time when the container image pull began.</p>
   * @public
   */
  pullStartedAt?: Date | undefined;
  /**
   * <p>The Unix timestamp for the time when the container image pull completed.</p>
   * @public
   */
  pullStoppedAt?: Date | undefined;
  /**
   * <p>The Unix timestamp for the time when the task started. More specifically, it's for the
   * 			time when the task transitioned from the <code>PENDING</code> state to the
   * 				<code>RUNNING</code> state.</p>
   * @public
   */
  startedAt?: Date | undefined;
  /**
   * <p>The tag specified when a task is started. If an Amazon ECS service started the task, the
   * 				<code>startedBy</code> parameter contains the deployment ID of that service.</p>
   * @public
   */
  startedBy?: string | undefined;
  /**
   * <p>The stop code indicating why a task was stopped. The <code>stoppedReason</code> might
   * 			contain additional details. </p>
   *          <p>For more information about stop code, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/stopped-task-error-codes.html">Stopped tasks
   * 				error codes</a> in the <i>Amazon ECS Developer Guide</i>.</p>
   * @public
   */
  stopCode?: TaskStopCode | undefined;
  /**
   * <p>The Unix timestamp for the time when the task was stopped. More specifically, it's for
   * 			the time when the task transitioned from the <code>RUNNING</code> state to the
   * 				<code>STOPPED</code> state.</p>
   * @public
   */
  stoppedAt?: Date | undefined;
  /**
   * <p>The reason that the task was stopped.</p>
   * @public
   */
  stoppedReason?: string | undefined;
  /**
   * <p>The Unix timestamp for the time when the task stops. More specifically, it's for the
   * 			time when the task transitions from the <code>RUNNING</code> state to
   * 				<code>STOPPING</code>.</p>
   * @public
   */
  stoppingAt?: Date | undefined;
  /**
   * <p>The metadata that you apply to the task to help you categorize and organize the task.
   * 			Each tag consists of a key and an optional value. You define both the key and
   * 			value.</p>
   *          <p>The following basic restrictions apply to tags:</p>
   *          <ul>
   *             <li>
   *                <p>Maximum number of tags per resource - 50</p>
   *             </li>
   *             <li>
   *                <p>For each resource, each tag key must be unique, and each tag key can have only
   *                     one value.</p>
   *             </li>
   *             <li>
   *                <p>Maximum key length - 128 Unicode characters in UTF-8</p>
   *             </li>
   *             <li>
   *                <p>Maximum value length - 256 Unicode characters in UTF-8</p>
   *             </li>
   *             <li>
   *                <p>If your tagging schema is used across multiple services and resources,
   *                     remember that other services may have restrictions on allowed characters.
   *                     Generally allowed characters are: letters, numbers, and spaces representable in
   *                     UTF-8, and the following characters: + - = . _ : / @.</p>
   *             </li>
   *             <li>
   *                <p>Tag keys and values are case-sensitive.</p>
   *             </li>
   *             <li>
   *                <p>Do not use <code>aws:</code>, <code>AWS:</code>, or any upper or lowercase
   *                     combination of such as a prefix for either keys or values as it is reserved for
   *                     Amazon Web Services use. You cannot edit or delete tag keys or values with this prefix. Tags with
   *                     this prefix do not count against your tags per resource limit.</p>
   *             </li>
   *          </ul>
   * @public
   */
  tags?: Tag[] | undefined;
  /**
   * <p>The Amazon Resource Name (ARN) of the task.</p>
   * @public
   */
  taskArn?: string | undefined;
  /**
   * <p>The ARN of the task definition that creates the task.</p>
   * @public
   */
  taskDefinitionArn?: string | undefined;
  /**
   * <p>The version counter for the task. Every time a task experiences a change that starts a
   * 			CloudWatch event, the version counter is incremented. If you replicate your Amazon ECS task state
   * 			with CloudWatch Events, you can compare the version of a task reported by the Amazon ECS API
   * 			actions with the version reported in CloudWatch Events for the task (inside the
   * 				<code>detail</code> object) to verify that the version in your event stream is
   * 			current.</p>
   * @public
   */
  version?: number | undefined;
  /**
   * <p>The ephemeral storage settings for the task.</p>
   * @public
   */
  ephemeralStorage?: EphemeralStorage | undefined;
  /**
   * <p>The Fargate ephemeral storage settings for the task.</p>
   * @public
   */
  fargateEphemeralStorage?: TaskEphemeralStorage | undefined;
}

export interface Failure {
  /**
   * <p>The Amazon Resource Name (ARN) of the failed resource.</p>
   * @public
   */
  arn?: string | undefined;
  /**
   * <p>The reason for the failure.</p>
   * @public
   */
  reason?: string | undefined;
  /**
   * <p>The details of the failure.</p>
   * @public
   */
  detail?: string | undefined;
}

export interface CapacityProviderStrategyItem {
  /**
   * <p>The short name of the capacity provider.</p>
   * @public
   */
  capacityProvider: string | undefined;
  /**
   * <p>The <i>weight</i> value designates the relative percentage of the total
   * 			number of tasks launched that should use the specified capacity provider. The
   * 				<code>weight</code> value is taken into consideration after the <code>base</code>
   * 			value, if defined, is satisfied.</p>
   *          <p>If no <code>weight</code> value is specified, the default value of <code>0</code> is
   * 			used. When multiple capacity providers are specified within a capacity provider
   * 			strategy, at least one of the capacity providers must have a weight value greater than
   * 			zero and any capacity providers with a weight of <code>0</code> can't be used to place
   * 			tasks. If you specify multiple capacity providers in a strategy that all have a weight
   * 			of <code>0</code>, any <code>RunTask</code> or <code>CreateService</code> actions using
   * 			the capacity provider strategy will fail.</p>
   *          <p>An example scenario for using weights is defining a strategy that contains two
   * 			capacity providers and both have a weight of <code>1</code>, then when the
   * 				<code>base</code> is satisfied, the tasks will be split evenly across the two
   * 			capacity providers. Using that same logic, if you specify a weight of <code>1</code> for
   * 				<i>capacityProviderA</i> and a weight of <code>4</code> for
   * 				<i>capacityProviderB</i>, then for every one task that's run using
   * 				<i>capacityProviderA</i>, four tasks would use
   * 				<i>capacityProviderB</i>.</p>
   * @public
   */
  weight?: number | undefined;
  /**
   * <p>The <i>base</i> value designates how many tasks, at a minimum, to run on
   * 			the specified capacity provider. Only one capacity provider in a capacity provider
   * 			strategy can have a <i>base</i> defined. If no value is specified, the
   * 			default value of <code>0</code> is used.</p>
   * @public
   */
  base?: number | undefined;
}

export declare const LaunchType: {
  readonly EC2: "EC2";
  readonly EXTERNAL: "EXTERNAL";
  readonly FARGATE: "FARGATE";
};
export type LaunchType = (typeof LaunchType)[keyof typeof LaunchType];

export declare const HealthStatus: {
  readonly HEALTHY: "HEALTHY";
  readonly UNHEALTHY: "UNHEALTHY";
  readonly UNKNOWN: "UNKNOWN";
};
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export interface NetworkConfiguration {
  /**
   * <p>The VPC subnets and security groups that are associated with a task.</p>
   *          <note>
   *             <p>All specified subnets and security groups must be from the same VPC.</p>
   *          </note>
   * @public
   */
  awsvpcConfiguration?: AwsVpcConfiguration | undefined;
}

export interface AwsVpcConfiguration {
  /**
   * <p>The IDs of the subnets associated with the task or service. There's a limit of 16
   * 			subnets that can be specified per <code>awsvpcConfiguration</code>.</p>
   *          <note>
   *             <p>All specified subnets must be from the same VPC.</p>
   *          </note>
   * @public
   */
  subnets: string[] | undefined;
  /**
   * <p>The IDs of the security groups associated with the task or service. If you don't
   * 			specify a security group, the default security group for the VPC is used. There's a
   * 			limit of 5 security groups that can be specified per
   * 			<code>awsvpcConfiguration</code>.</p>
   *          <note>
   *             <p>All specified security groups must be from the same VPC.</p>
   *          </note>
   * @public
   */
  securityGroups?: string[] | undefined;
  /**
   * <p>Whether the task's elastic network interface receives a public IP address. The default
   * 			value is <code>ENABLED</code>.</p>
   * @public
   */
  assignPublicIp?: AssignPublicIp | undefined;
}

export declare const AssignPublicIp: {
  readonly DISABLED: "DISABLED";
  readonly ENABLED: "ENABLED";
};
export type AssignPublicIp =
  (typeof AssignPublicIp)[keyof typeof AssignPublicIp];

export interface InferenceAccelerator {
  /**
   * <p>The Elastic Inference accelerator device name. The <code>deviceName</code> must also
   * 			be referenced in a container definition as a <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ResourceRequirement.html">ResourceRequirement</a>.</p>
   * @public
   */
  deviceName: string | undefined;
  /**
   * <p>The Elastic Inference accelerator type to use.</p>
   * @public
   */
  deviceType: string | undefined;
}

export interface TaskOverride {
  /**
   * <p>One or more container overrides that are sent to a task.</p>
   * @public
   */
  containerOverrides?: ContainerOverride[] | undefined;
  /**
   * <p>The CPU override for the task.</p>
   * @public
   */
  cpu?: string | undefined;
  /**
   * <p>The Elastic Inference accelerator override for the task.</p>
   * @public
   */
  inferenceAcceleratorOverrides?: InferenceAcceleratorOverride[] | undefined;
  /**
   * <p>The Amazon Resource Name (ARN) of the task execution role override for the task. For more information,
   * 			see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html">Amazon ECS task
   * 				execution IAM role</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  executionRoleArn?: string | undefined;
  /**
   * <p>The memory override for the task.</p>
   * @public
   */
  memory?: string | undefined;
  /**
   * <p>The Amazon Resource Name (ARN) of the role that containers in this task can assume. All containers in
   * 			this task are granted the permissions that are specified in this role. For more
   * 			information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html">IAM Role for Tasks</a>
   * 			in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  taskRoleArn?: string | undefined;
  /**
   * <p>The ephemeral storage setting override for the task.</p>
   *          <note>
   *             <p>This parameter is only supported for tasks hosted on Fargate that
   * 				use the following platform versions:</p>
   *             <ul>
   *                <li>
   *                   <p>Linux platform version <code>1.4.0</code> or later.</p>
   *                </li>
   *                <li>
   *                   <p>Windows platform version <code>1.0.0</code> or later.</p>
   *                </li>
   *             </ul>
   *          </note>
   * @public
   */
  ephemeralStorage?: EphemeralStorage | undefined;
}

export declare const TaskStopCode: {
  readonly ESSENTIAL_CONTAINER_EXITED: "EssentialContainerExited";
  readonly SERVICE_SCHEDULER_INITIATED: "ServiceSchedulerInitiated";
  readonly SPOT_INTERRUPTION: "SpotInterruption";
  readonly TASK_FAILED_TO_START: "TaskFailedToStart";
  readonly TERMINATION_NOTICE: "TerminationNotice";
  readonly USER_INITIATED: "UserInitiated";
};
export type TaskStopCode = (typeof TaskStopCode)[keyof typeof TaskStopCode];

export interface PlacementConstraint {
  /**
   * <p>The type of constraint. Use <code>distinctInstance</code> to ensure that each task in
   * 			a particular group is running on a different container instance. Use
   * 				<code>memberOf</code> to restrict the selection to a group of valid
   * 			candidates.</p>
   * @public
   */
  type?: PlacementConstraintType | undefined;
  /**
   * <p>A cluster query language expression to apply to the constraint. The expression can
   * 			have a maximum length of 2000 characters. You can't specify an expression if the
   * 			constraint type is <code>distinctInstance</code>. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cluster-query-language.html">Cluster query language</a> in the <i>Amazon Elastic Container Service Developer Guide</i>.</p>
   * @public
   */
  expression?: string | undefined;
}

export declare const PropagateTags: {
  readonly NONE: "NONE";
  readonly SERVICE: "SERVICE";
  readonly TASK_DEFINITION: "TASK_DEFINITION";
};
export type PropagateTags = (typeof PropagateTags)[keyof typeof PropagateTags];

export interface TaskVolumeConfiguration {
  /**
   * <p>The name of the volume. This value must match the volume name from the
   * 				<code>Volume</code> object in the task definition.</p>
   * @public
   */
  name: string | undefined;
  /**
   * <p>The configuration for the Amazon EBS volume that Amazon ECS creates and manages on your behalf.
   * 			These settings are used to create each Amazon EBS volume, with one volume created for each
   * 			task. The Amazon EBS volumes are visible in your account in the Amazon EC2 console once they are
   * 			created.</p>
   * @public
   */
  managedEBSVolume?: TaskManagedEBSVolumeConfiguration | undefined;
}

export interface Attachment {
  /**
   * <p>The unique identifier for the attachment.</p>
   * @public
   */
  id?: string | undefined;
  /**
   * <p>The type of the attachment, such as <code>ElasticNetworkInterface</code>,
   * 				<code>Service Connect</code>, and <code>AmazonElasticBlockStorage</code>.</p>
   * @public
   */
  type?: string | undefined;
  /**
   * <p> The status of the attachment. Valid values are <code>PRECREATED</code>,
   * 				<code>CREATED</code>, <code>ATTACHING</code>, <code>ATTACHED</code>,
   * 				<code>DETACHING</code>, <code>DETACHED</code>, <code>DELETED</code>, and
   * 				<code>FAILED</code>.</p>
   * @public
   */
  status?: string | undefined;
  /**
   * <p>Details of the attachment.</p>
   *          <p>For elastic network interfaces, this includes the network interface ID, the MAC
   * 			address, the subnet ID, and the private IPv4 address.</p>
   *          <p>For Service Connect services, this includes <code>portName</code>,
   * 				<code>clientAliases</code>, <code>discoveryName</code>, and
   * 				<code>ingressPortOverride</code>.</p>
   *          <p>For Elastic Block Storage, this includes <code>roleArn</code>,
   * 				<code>deleteOnTermination</code>, <code>volumeName</code>, <code>volumeId</code>,
   * 			and <code>statusReason</code> (only when the attachment fails to create or
   * 			attach).</p>
   * @public
   */
  details?: KeyValuePair[] | undefined;
}

export interface Attribute {
  /**
   * <p>The name of the attribute. The <code>name</code> must contain between 1 and 128
   * 			characters. The name may contain letters (uppercase and lowercase), numbers, hyphens
   * 			(-), underscores (_), forward slashes (/), back slashes (\), or periods (.).</p>
   * @public
   */
  name: string | undefined;
  /**
   * <p>The value of the attribute. The <code>value</code> must contain between 1 and 128
   * 			characters. It can contain letters (uppercase and lowercase), numbers, hyphens (-),
   * 			underscores (_), periods (.), at signs (@), forward slashes (/), back slashes (\),
   * 			colons (:), or spaces. The value can't start or end with a space.</p>
   * @public
   */
  value?: string | undefined;
  /**
   * <p>The type of the target to attach the attribute with. This parameter is required if you
   * 			use the short form ID for a resource instead of the full ARN.</p>
   * @public
   */
  targetType?: TargetType | undefined;
  /**
   * <p>The ID of the target. You can specify the short form ID for a resource or the full
   * 			Amazon Resource Name (ARN).</p>
   * @public
   */
  targetId?: string | undefined;
}

export declare const Connectivity: {
  readonly CONNECTED: "CONNECTED";
  readonly DISCONNECTED: "DISCONNECTED";
};
export type Connectivity = (typeof Connectivity)[keyof typeof Connectivity];

export interface Container {
  /**
   * <p>The Amazon Resource Name (ARN) of the container.</p>
   * @public
   */
  containerArn?: string | undefined;
  /**
   * <p>The ARN of the task.</p>
   * @public
   */
  taskArn?: string | undefined;
  /**
   * <p>The name of the container.</p>
   * @public
   */
  name?: string | undefined;
  /**
   * <p>The image used for the container.</p>
   * @public
   */
  image?: string | undefined;
  /**
   * <p>The container image manifest digest.</p>
   * @public
   */
  imageDigest?: string | undefined;
  /**
   * <p>The ID of the Docker container.</p>
   * @public
   */
  runtimeId?: string | undefined;
  /**
   * <p>The last known status of the container.</p>
   * @public
   */
  lastStatus?: string | undefined;
  /**
   * <p>The exit code returned from the container.</p>
   * @public
   */
  exitCode?: number | undefined;
  /**
   * <p>A short (255 max characters) human-readable string to provide additional details about
   * 			a running or stopped container.</p>
   * @public
   */
  reason?: string | undefined;
  /**
   * <p>The network bindings associated with the container.</p>
   * @public
   */
  networkBindings?: NetworkBinding[] | undefined;
  /**
   * <p>The network interfaces associated with the container.</p>
   * @public
   */
  networkInterfaces?: NetworkInterface[] | undefined;
  /**
   * <p>The health status of the container. If health checks aren't configured for this
   * 			container in its task definition, then it reports the health status as
   * 				<code>UNKNOWN</code>.</p>
   * @public
   */
  healthStatus?: HealthStatus | undefined;
  /**
   * <p>The details of any Amazon ECS managed agents associated with the container.</p>
   * @public
   */
  managedAgents?: ManagedAgent[] | undefined;
  /**
   * <p>The number of CPU units set for the container. The value is <code>0</code> if no value
   * 			was specified in the container definition when the task definition was
   * 			registered.</p>
   * @public
   */
  cpu?: string | undefined;
  /**
   * <p>The hard limit (in MiB) of memory set for the container.</p>
   * @public
   */
  memory?: string | undefined;
  /**
   * <p>The soft limit (in MiB) of memory set for the container.</p>
   * @public
   */
  memoryReservation?: string | undefined;
  /**
   * <p>The IDs of each GPU assigned to the container.</p>
   * @public
   */
  gpuIds?: string[] | undefined;
}

export interface ContainerOverride {
  /**
   * <p>The name of the container that receives the override. This parameter is required if
   * 			any override is specified.</p>
   * @public
   */
  name?: string | undefined;
  /**
   * <p>The command to send to the container that overrides the default command from the
   * 			Docker image or the task definition. You must also specify a container name.</p>
   * @public
   */
  command?: string[] | undefined;
  /**
   * <p>The environment variables to send to the container. You can add new environment
   * 			variables, which are added to the container at launch, or you can override the existing
   * 			environment variables from the Docker image or the task definition. You must also
   * 			specify a container name.</p>
   * @public
   */
  environment?: KeyValuePair[] | undefined;
  /**
   * <p>A list of files containing the environment variables to pass to a container, instead
   * 			of the value from the container definition.</p>
   * @public
   */
  environmentFiles?: EnvironmentFile[] | undefined;
  /**
   * <p>The number of <code>cpu</code> units reserved for the container, instead of the
   * 			default value from the task definition. You must also specify a container name.</p>
   * @public
   */
  cpu?: number | undefined;
  /**
   * <p>The hard limit (in MiB) of memory to present to the container, instead of the default
   * 			value from the task definition. If your container attempts to exceed the memory
   * 			specified here, the container is killed. You must also specify a container name.</p>
   * @public
   */
  memory?: number | undefined;
  /**
   * <p>The soft limit (in MiB) of memory to reserve for the container, instead of the default
   * 			value from the task definition. You must also specify a container name.</p>
   * @public
   */
  memoryReservation?: number | undefined;
  /**
   * <p>The type and amount of a resource to assign to a container, instead of the default
   * 			value from the task definition. The only supported resource is a GPU.</p>
   * @public
   */
  resourceRequirements?: ResourceRequirement[] | undefined;
}

export interface TaskEphemeralStorage {
  /**
   * <p>The total amount, in GiB, of the ephemeral storage to set for the task. The minimum
   * 			supported value is <code>20</code> GiB and the maximum supported value is
   * 				<code>200</code> GiB.</p>
   * @public
   */
  sizeInGiB?: number | undefined;
  /**
   * <p>Specify an Key Management Service key ID to encrypt the ephemeral storage for the
   * 			task.</p>
   * @public
   */
  kmsKeyId?: string | undefined;
}

export interface InferenceAcceleratorOverride {
  /**
   * <p>The Elastic Inference accelerator device name to override for the task. This parameter
   * 			must match a <code>deviceName</code> specified in the task definition.</p>
   * @public
   */
  deviceName?: string | undefined;
  /**
   * <p>The Elastic Inference accelerator type to use.</p>
   * @public
   */
  deviceType?: string | undefined;
}

export interface EphemeralStorage {
  /**
   * <p>The total amount, in GiB, of ephemeral storage to set for the task. The minimum
   * 			supported value is <code>21</code> GiB and the maximum supported value is
   * 				<code>200</code> GiB.</p>
   * @public
   */
  sizeInGiB: number | undefined;
}

export interface TaskManagedEBSVolumeConfiguration {
  /**
   * <p>Indicates whether the volume should be encrypted. If no value is specified, encryption
   * 			is turned on by default. This parameter maps 1:1 with the <code>Encrypted</code>
   * 			parameter of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in
   * 			the <i>Amazon EC2 API Reference</i>.</p>
   * @public
   */
  encrypted?: boolean | undefined;
  /**
   * <p>The Amazon Resource Name (ARN) identifier of the Amazon Web Services Key Management Service key to use for Amazon EBS encryption. When
   * 			encryption is turned on and no Amazon Web Services Key Management Service key is specified, the default Amazon Web Services managed key
   * 			for Amazon EBS volumes is used. This parameter maps 1:1 with the <code>KmsKeyId</code>
   * 			parameter of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in
   * 			the <i>Amazon EC2 API Reference</i>.</p>
   *          <important>
   *             <p>Amazon Web Services authenticates the Amazon Web Services Key Management Service key asynchronously. Therefore, if you specify an
   * 				ID, alias, or ARN that is invalid, the action can appear to complete, but
   * 				eventually fails.</p>
   *          </important>
   * @public
   */
  kmsKeyId?: string | undefined;
  /**
   * <p>The volume type. This parameter maps 1:1 with the <code>VolumeType</code> parameter of
   * 			the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in the <i>Amazon EC2 API Reference</i>. For more
   * 			information, see <a href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-volume-types.html">Amazon EBS volume types</a> in
   * 			the <i>Amazon EC2 User Guide</i>.</p>
   *          <p>The following are the supported volume types.</p>
   *          <ul>
   *             <li>
   *                <p>General Purpose SSD: <code>gp2</code>|<code>gp3</code>
   *                </p>
   *             </li>
   *             <li>
   *                <p>Provisioned IOPS SSD: <code>io1</code>|<code>io2</code>
   *                </p>
   *             </li>
   *             <li>
   *                <p>Throughput Optimized HDD: <code>st1</code>
   *                </p>
   *             </li>
   *             <li>
   *                <p>Cold HDD: <code>sc1</code>
   *                </p>
   *             </li>
   *             <li>
   *                <p>Magnetic: <code>standard</code>
   *                </p>
   *                <note>
   *                   <p>The magnetic volume type is not supported on Fargate.</p>
   *                </note>
   *             </li>
   *          </ul>
   * @public
   */
  volumeType?: string | undefined;
  /**
   * <p>The size of the volume in GiB. You must specify either a volume size or a snapshot ID.
   * 			If you specify a snapshot ID, the snapshot size is used for the volume size by default.
   * 			You can optionally specify a volume size greater than or equal to the snapshot size.
   * 			This parameter maps 1:1 with the <code>Size</code> parameter of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in the <i>Amazon EC2 API Reference</i>.</p>
   *          <p>The following are the supported volume size values for each volume type.</p>
   *          <ul>
   *             <li>
   *                <p>
   *                   <code>gp2</code> and <code>gp3</code>: 1-16,384</p>
   *             </li>
   *             <li>
   *                <p>
   *                   <code>io1</code> and <code>io2</code>: 4-16,384</p>
   *             </li>
   *             <li>
   *                <p>
   *                   <code>st1</code> and <code>sc1</code>: 125-16,384</p>
   *             </li>
   *             <li>
   *                <p>
   *                   <code>standard</code>: 1-1,024</p>
   *             </li>
   *          </ul>
   * @public
   */
  sizeInGiB?: number | undefined;
  /**
   * <p>The snapshot that Amazon ECS uses to create the volume. You must specify either a snapshot
   * 			ID or a volume size. This parameter maps 1:1 with the <code>SnapshotId</code> parameter
   * 			of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in
   * 			the <i>Amazon EC2 API Reference</i>.</p>
   * @public
   */
  snapshotId?: string | undefined;
  /**
   * <p>The number of I/O operations per second (IOPS). For <code>gp3</code>,
   * 			<code>io1</code>, and <code>io2</code> volumes, this represents the number of IOPS that
   * 			are provisioned for the volume. For <code>gp2</code> volumes, this represents the
   * 			baseline performance of the volume and the rate at which the volume accumulates I/O
   * 			credits for bursting.</p>
   *          <p>The following are the supported values for each volume type.</p>
   *          <ul>
   *             <li>
   *                <p>
   *                   <code>gp3</code>: 3,000 - 16,000 IOPS</p>
   *             </li>
   *             <li>
   *                <p>
   *                   <code>io1</code>: 100 - 64,000 IOPS</p>
   *             </li>
   *             <li>
   *                <p>
   *                   <code>io2</code>: 100 - 256,000 IOPS</p>
   *             </li>
   *          </ul>
   *          <p>This parameter is required for <code>io1</code> and <code>io2</code> volume types. The
   * 			default for <code>gp3</code> volumes is <code>3,000 IOPS</code>. This parameter is not
   * 			supported for <code>st1</code>, <code>sc1</code>, or <code>standard</code> volume
   * 			types.</p>
   *          <p>This parameter maps 1:1 with the <code>Iops</code> parameter of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in the <i>Amazon EC2 API Reference</i>.</p>
   * @public
   */
  iops?: number | undefined;
  /**
   * <p>The throughput to provision for a volume, in MiB/s, with a maximum of 1,000 MiB/s.
   * 			This parameter maps 1:1 with the <code>Throughput</code> parameter of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in the <i>Amazon EC2 API Reference</i>.</p>
   *          <important>
   *             <p>This parameter is only supported for the <code>gp3</code> volume type.</p>
   *          </important>
   * @public
   */
  throughput?: number | undefined;
  /**
   * <p>The tags to apply to the volume. Amazon ECS applies service-managed tags by default. This
   * 			parameter maps 1:1 with the <code>TagSpecifications.N</code> parameter of the <a href="https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_CreateVolume.html">CreateVolume API</a> in the <i>Amazon EC2 API Reference</i>.</p>
   * @public
   */
  tagSpecifications?: EBSTagSpecification[] | undefined;
  /**
   * <p>The ARN of the IAM role to associate with this volume. This is the Amazon ECS
   * 			infrastructure IAM role that is used to manage your Amazon Web Services infrastructure. We recommend
   * 			using the Amazon ECS-managed <code>AmazonECSInfrastructureRolePolicyForVolumes</code> IAM
   * 			policy with this role. For more information, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/infrastructure_IAM_role.html">Amazon ECS
   * 				infrastructure IAM role</a> in the <i>Amazon ECS Developer
   * 			Guide</i>.</p>
   * @public
   */
  roleArn: string | undefined;
  /**
   * <p>The termination policy for the volume when the task exits. This provides a way to
   * 			control whether Amazon ECS terminates the Amazon EBS volume when the task stops.</p>
   * @public
   */
  terminationPolicy?: TaskManagedEBSVolumeTerminationPolicy | undefined;
  /**
     * <p>The Linux filesystem type for the volume. For volumes created from a snapshot, you
     * 			must specify the same filesystem type that the volume was using when the snapshot was
     * 			created. If there is a filesystem type mismatch, the task will fail to start.</p>
     *          <p>The available filesystem types are
   <code>ext3</code>, <code>ext4</code>, and
     * 				<code>xfs</code>. If no value is specified, the <code>xfs</code> filesystem type is
     * 			used by default.</p>
     * @public
     */
  filesystemType?: TaskFilesystemType | undefined;
}

export interface PlacementStrategy {
  /**
   * <p>The type of placement strategy. The <code>random</code> placement strategy randomly
   * 			places tasks on available candidates. The <code>spread</code> placement strategy spreads
   * 			placement across available candidates evenly based on the <code>field</code> parameter.
   * 			The <code>binpack</code> strategy places tasks on available candidates that have the
   * 			least available amount of the resource that's specified with the <code>field</code>
   * 			parameter. For example, if you binpack on memory, a task is placed on the instance with
   * 			the least amount of remaining memory but still enough to run the task.</p>
   * @public
   */
  type?: PlacementStrategyType | undefined;
  /**
   * <p>The field to apply the placement strategy against. For the <code>spread</code>
   * 			placement strategy, valid values are <code>instanceId</code> (or <code>host</code>,
   * 			which has the same effect), or any platform or custom attribute that's applied to a
   * 			container instance, such as <code>attribute:ecs.availability-zone</code>. For the
   * 				<code>binpack</code> placement strategy, valid values are <code>cpu</code> and
   * 				<code>memory</code>. For the <code>random</code> placement strategy, this field is
   * 			not used.</p>
   * @public
   */
  field?: string | undefined;
}

export declare const PlacementStrategyType: {
  readonly BINPACK: "binpack";
  readonly RANDOM: "random";
  readonly SPREAD: "spread";
};
/**
 * @public
 */
export type PlacementStrategyType =
  (typeof PlacementStrategyType)[keyof typeof PlacementStrategyType];

export declare const PlacementConstraintType: {
  readonly DISTINCT_INSTANCE: "distinctInstance";
  readonly MEMBER_OF: "memberOf";
};
export type PlacementConstraintType =
  (typeof PlacementConstraintType)[keyof typeof PlacementConstraintType];

export interface KeyValuePair {
  /**
   * <p>The name of the key-value pair. For environment variables, this is the name of the
   * 			environment variable.</p>
   * @public
   */
  name?: string | undefined;
  /**
   * <p>The value of the key-value pair. For environment variables, this is the value of the
   * 			environment variable.</p>
   * @public
   */
  value?: string | undefined;
}

export declare const TargetType: {
  readonly CONTAINER_INSTANCE: "container-instance";
};
export type TargetType = (typeof TargetType)[keyof typeof TargetType];

export interface NetworkBinding {
  /**
   * <p>The IP address that the container is bound to on the container instance.</p>
   * @public
   */
  bindIP?: string | undefined;
  /**
   * <p>The port number on the container that's used with the network binding.</p>
   * @public
   */
  containerPort?: number | undefined;
  /**
   * <p>The port number on the host that's used with the network binding.</p>
   * @public
   */
  hostPort?: number | undefined;
  /**
   * <p>The protocol used for the network binding.</p>
   * @public
   */
  protocol?: TransportProtocol | undefined;
  /**
   * <p>The port number range on the container that's bound to the dynamically mapped host
   * 			port range.</p>
   *          <p>The following rules apply when you specify a <code>containerPortRange</code>:</p>
   *          <ul>
   *             <li>
   *                <p>You must use either the <code>bridge</code> network mode or the <code>awsvpc</code>
   * 					network mode.</p>
   *             </li>
   *             <li>
   *                <p>This parameter is available for both the EC2 and Fargate launch types.</p>
   *             </li>
   *             <li>
   *                <p>This parameter is available for both the Linux and Windows operating systems.</p>
   *             </li>
   *             <li>
   *                <p>The container instance must have at least version 1.67.0 of the container agent
   * 					and at least version 1.67.0-1 of the <code>ecs-init</code> package </p>
   *             </li>
   *             <li>
   *                <p>You can specify a maximum of 100 port ranges per container.</p>
   *             </li>
   *             <li>
   *                <p>You do not specify a <code>hostPortRange</code>. The value of the <code>hostPortRange</code> is set
   * 					as follows:</p>
   *                <ul>
   *                   <li>
   *                      <p>For containers in a task with the <code>awsvpc</code> network mode,
   * 							the <code>hostPortRange</code> is set to the same value as the
   * 								<code>containerPortRange</code>. This is a static mapping
   * 							strategy.</p>
   *                   </li>
   *                   <li>
   *                      <p>For containers in a task with the <code>bridge</code> network mode, the Amazon ECS agent finds open host ports from the default ephemeral range and passes it to docker to bind them to the container ports.</p>
   *                   </li>
   *                </ul>
   *             </li>
   *             <li>
   *                <p>The <code>containerPortRange</code> valid values are between 1 and
   * 					65535.</p>
   *             </li>
   *             <li>
   *                <p>A port can only be included in one port mapping per container.</p>
   *             </li>
   *             <li>
   *                <p>You cannot specify overlapping port ranges.</p>
   *             </li>
   *             <li>
   *                <p>The first port in the range must be less than last port in the range.</p>
   *             </li>
   *             <li>
   *                <p>Docker recommends that you turn off the docker-proxy in the Docker daemon config file when you have a large number of ports.</p>
   *                <p>For more information, see <a href="https://github.com/moby/moby/issues/11185"> Issue #11185</a> on the Github website.</p>
   *                <p>For information about how to  turn off the docker-proxy in the Docker daemon config file, see <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/bootstrap_container_instance.html#bootstrap_docker_daemon">Docker daemon</a> in the <i>Amazon ECS Developer Guide</i>.</p>
   *             </li>
   *          </ul>
   *          <p>You can call <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_DescribeTasks.html">
   *                <code>DescribeTasks</code>
   *             </a> to view the <code>hostPortRange</code> which
   * 			are the host ports that are bound to the container ports.</p>
   * @public
   */
  containerPortRange?: string | undefined;
  /**
   * <p>The port number range on the host that's used with the network binding. This is
   * 			assigned is assigned by Docker and delivered by the Amazon ECS agent.</p>
   * @public
   */
  hostPortRange?: string | undefined;
}

export interface NetworkInterface {
  /**
   * <p>The attachment ID for the network interface.</p>
   * @public
   */
  attachmentId?: string | undefined;
  /**
   * <p>The private IPv4 address for the network interface.</p>
   * @public
   */
  privateIpv4Address?: string | undefined;
  /**
   * <p>The private IPv6 address for the network interface.</p>
   * @public
   */
  ipv6Address?: string | undefined;
}

export interface ManagedAgent {
  /**
   * <p>The Unix timestamp for the time when the managed agent was last started.</p>
   * @public
   */
  lastStartedAt?: Date | undefined;
  /**
   * <p>The name of the managed agent. When the execute command feature is turned on, the
   * 			managed agent name is <code>ExecuteCommandAgent</code>.</p>
   * @public
   */
  name?: ManagedAgentName | undefined;
  /**
   * <p>The reason for why the managed agent is in the state it is in.</p>
   * @public
   */
  reason?: string | undefined;
  /**
   * <p>The last known status of the managed agent.</p>
   * @public
   */
  lastStatus?: string | undefined;
}
export declare const ManagedAgentName: {
  readonly ExecuteCommandAgent: "ExecuteCommandAgent";
};
export type ManagedAgentName =
  (typeof ManagedAgentName)[keyof typeof ManagedAgentName];

export interface EnvironmentFile {
  /**
   * <p>The Amazon Resource Name (ARN) of the Amazon S3 object containing the environment
   * 			variable file.</p>
   * @public
   */
  value: string | undefined;
  /**
   * <p>The file type to use. Environment files are objects in Amazon S3. The only supported value
   * 			is <code>s3</code>.</p>
   * @public
   */
  type: EnvironmentFileType | undefined;
}

export declare const EnvironmentFileType: {
  readonly S3: "s3";
};
export type EnvironmentFileType =
  (typeof EnvironmentFileType)[keyof typeof EnvironmentFileType];

export interface ResourceRequirement {
  /**
   * <p>The value for the specified resource type.</p>
   *          <p>When the type is <code>GPU</code>, the value is the number of physical
   * 				<code>GPUs</code> the Amazon ECS container agent reserves for the container. The number
   * 			of GPUs that's reserved for all containers in a task can't exceed the number of
   * 			available GPUs on the container instance that the task is launched on.</p>
   *          <p>When the type is <code>InferenceAccelerator</code>, the <code>value</code> matches the
   * 				<code>deviceName</code> for an <a href="https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_InferenceAccelerator.html">InferenceAccelerator</a> specified in a task definition.</p>
   * @public
   */
  value: string | undefined;
  /**
   * <p>The type of resource to assign to a container. </p>
   * @public
   */
  type: ResourceType | undefined;
}

export declare const ResourceType: {
  readonly GPU: "GPU";
  readonly INFERENCE_ACCELERATOR: "InferenceAccelerator";
};
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export declare const EBSResourceType: {
  readonly VOLUME: "volume";
};
export type EBSResourceType =
  (typeof EBSResourceType)[keyof typeof EBSResourceType];

export interface EBSTagSpecification {
  /**
   * <p>The type of volume resource.</p>
   * @public
   */
  resourceType: EBSResourceType | undefined;
  /**
   * <p>The tags applied to this Amazon EBS volume. <code>AmazonECSCreated</code> and
   * 				<code>AmazonECSManaged</code> are reserved tags that can't be used.</p>
   * @public
   */
  tags?: Tag[] | undefined;
  /**
     * <p>Determines whether to propagate the tags from the task definition to
  the Amazon EBS
     * 			volume. Tags can only propagate to a <code>SERVICE</code> specified in
     *
  <code>ServiceVolumeConfiguration</code>. If no value is specified, the tags aren't
     *
  propagated.</p>
     * @public
     */
  propagateTags?: PropagateTags | undefined;
}

export interface TaskManagedEBSVolumeTerminationPolicy {
  /**
     * <p>Indicates whether the volume should be deleted on when the task stops. If a value of
     * 				<code>true</code> is specified,
  Amazon ECS deletes the Amazon EBS volume on your behalf when
     * 			the task goes into the <code>STOPPED</code> state. If no value is specified, the
     *
  default value is <code>true</code> is used. When set to <code>false</code>, Amazon ECS
     * 			leaves the volume in your
  account.</p>
     * @public
     */
  deleteOnTermination: boolean | undefined;
}

export declare const TaskFilesystemType: {
  readonly EXT3: "ext3";
  readonly EXT4: "ext4";
  readonly NTFS: "ntfs";
  readonly XFS: "xfs";
};
export type TaskFilesystemType =
  (typeof TaskFilesystemType)[keyof typeof TaskFilesystemType];

export declare const TransportProtocol: {
  readonly TCP: "tcp";
  readonly UDP: "udp";
};
export type TransportProtocol =
  (typeof TransportProtocol)[keyof typeof TransportProtocol];

export interface Tag {
  /**
   * <p>One part of a key-value pair that make up a tag. A <code>key</code> is a general label
   * 			that acts like a category for more specific tag values.</p>
   * @public
   */
  key?: string | undefined;
  /**
   * <p>The optional part of a key-value pair that make up a tag. A <code>value</code> acts as
   * 			a descriptor within a tag category (key).</p>
   * @public
   */
  value?: string | undefined;
}
