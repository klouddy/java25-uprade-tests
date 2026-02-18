import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface BenchmarkInfraStackProps extends cdk.StackProps {
  javaVersion: string;
  containerImage: string;
  cpu: number;
  memoryLimitMiB: number;
  desiredCount: number;
  dbEngine: string;
  // Note: dbInstanceClass is currently not used; instance type is hardcoded to db.t4g.micro
  // TODO: Implement proper instance class parsing to support different RDS instance types
  dbInstanceClass?: string;
}

export class BenchmarkInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BenchmarkInfraStackProps) {
    super(scope, id, props);

    // 1. VPC - Create a new VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'BenchmarkVpc', {
      maxAzs: 2,
      natGateways: 1, // One NAT gateway to save costs while allowing ECS tasks to reach internet
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // 2. RDS Database - PostgreSQL with Secrets Manager for credentials
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: `benchmark-db-credentials-${props.javaVersion}`,
      description: 'Database credentials for benchmark application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // OK for benchmark environment
    });

    // RDS Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false, // Restrict outbound traffic
    });

    // Determine database engine and port
    const isPostgres = props.dbEngine.toLowerCase().includes('postgres');
    const dbPort = isPostgres ? 5432 : 3306;
    const engineVersion = isPostgres
      ? rds.PostgresEngineVersion.VER_15
      : rds.MysqlEngineVersion.VER_8_0;
    
    const engine = isPostgres
      ? rds.DatabaseInstanceEngine.postgres({ version: engineVersion as rds.PostgresEngineVersion })
      : rds.DatabaseInstanceEngine.mysql({ version: engineVersion as rds.MysqlEngineVersion });

    // Parse instance class from string (e.g., 'db.t4g.micro')
    // For simplicity, we'll use a hardcoded instance type but document the limitation
    // In a production environment, you'd want to parse this more robustly
    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.BURSTABLE4_GRAVITON,
      ec2.InstanceSize.MICRO
    );

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine,
      instanceType,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'benchmarkdb',
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(0), // No backups for benchmark environment
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // OK for benchmark environment
      deletionProtection: false,
    });

    // 3. ECS Cluster
    const cluster = new ecs.Cluster(this, 'BenchmarkCluster', {
      vpc,
      clusterName: `benchmark-cluster-java${props.javaVersion}`,
      enableFargateCapacityProviders: true,
    });

    // ECS Task Role - allows task to read secrets
    const taskRole = new cdk.aws_iam.Role(this, 'TaskRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for ECS tasks to access AWS services',
    });

    // Grant task role permission to read the database secret
    dbSecret.grantRead(taskRole);

    // ECS Task Execution Role - for pulling images and writing logs
    const executionRole = new cdk.aws_iam.Role(this, 'ExecutionRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Create log group for ECS tasks
    const logGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      logGroupName: `/ecs/benchmark-app-java${props.javaVersion}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      memoryLimitMiB: props.memoryLimitMiB,
      cpu: props.cpu,
      taskRole,
      executionRole,
    });

    // Build database URL
    const dbUrl = `jdbc:${isPostgres ? 'postgresql' : 'mysql'}://${database.dbInstanceEndpointAddress}:${dbPort}/benchmarkdb`;

    // Add container to task definition
    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(props.containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'benchmark-app',
        logGroup,
      }),
      environment: {
        SPRING_PROFILES_ACTIVE: 'ecs',
        DATABASE_URL: dbUrl,
        SPRING_DATASOURCE_URL: dbUrl,
        DB_POOL_SIZE: '50',
        SERVER_PORT: '8080',
        TOMCAT_MAX_THREADS: '200',
      },
      secrets: {
        DATABASE_USER: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        SPRING_DATASOURCE_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
        SPRING_DATASOURCE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // ECS Service Security Group
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true, // Allow outbound for internet access
    });

    // Allow ECS tasks to connect to RDS
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(dbPort),
      'Allow ECS tasks to connect to database'
    );

    // 4. Application Load Balancer (ALB)
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from anywhere
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/actuator/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ALB Listener
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Allow ALB to connect to ECS tasks
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow ALB to connect to ECS tasks'
    );

    // 5. ECS Fargate Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: props.desiredCount,
      assignPublicIp: false,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // Attach ECS service to ALB target group
    service.attachToApplicationTargetGroup(targetGroup);

    // 6. CloudFormation Outputs
    new cdk.CfnOutput(this, 'AlbUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'URL of the Application Load Balancer',
      exportName: `BenchmarkAlbUrl-Java${props.javaVersion}`,
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `BenchmarkAlbDns-Java${props.javaVersion}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'Name of the ECS cluster',
      exportName: `BenchmarkClusterName-Java${props.javaVersion}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: service.serviceName,
      description: 'Name of the ECS service',
      exportName: `BenchmarkServiceName-Java${props.javaVersion}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'Endpoint of the RDS database',
      exportName: `BenchmarkDbEndpoint-Java${props.javaVersion}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'ARN of the database credentials secret',
      exportName: `BenchmarkDbSecretArn-Java${props.javaVersion}`,
    });
  }
}
