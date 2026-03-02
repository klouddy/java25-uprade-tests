#!/usr/bin/env node

const { Command, Flags } = require('@oclif/core');
const inquirer = require('inquirer');
const chalk = require('chalk');

const {
  ECSClient,
  ListServicesCommand,
  UpdateServiceCommand,
  DeleteServiceCommand,
  DescribeServicesCommand,
  DeleteClusterCommand,
  ListTaskDefinitionsCommand,
  DeregisterTaskDefinitionCommand
} = require('@aws-sdk/client-ecs');

const {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DeleteLoadBalancerCommand,
  DescribeTargetGroupsCommand,
  DeleteTargetGroupCommand
} = require('@aws-sdk/client-elastic-load-balancing-v2');

const {
  RDSClient,
  DescribeDBInstancesCommand,
  DeleteDBInstanceCommand,
  DescribeDBSubnetGroupsCommand,
  DeleteDBSubnetGroupCommand
} = require('@aws-sdk/client-rds');

const {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DeleteSecurityGroupCommand
} = require('@aws-sdk/client-ec2');

const {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  DetachRolePolicyCommand,
  ListRolePoliciesCommand,
  DeleteRolePolicyCommand,
  DeleteRoleCommand
} = require('@aws-sdk/client-iam');

class AwsCleanupCommand extends Command {
  static description = 'Find and delete AWS resources created by benchmark bootstrap';

  static flags = {
    help: Flags.help({ description: 'show CLI help' }),
    verbose: Flags.boolean({ description: 'verbose output', default: false })
  };

  constructor(argv, config) {
    super(argv, config);
    this.region = 'us-east-1';

    this.names = {
      cluster: 'java-bench-cluster',
      services: ['java-bench-service', 'java-bench-prometheus-service'],
      taskFamilyPrefix: 'java-bench-task',
      alb: 'java-bench-alb',
      targetGroups: ['java-bench-targets', 'java-bench-prom-targets'],
      db: 'java-bench-db',
      dbSubnetGroup: 'java-bench-db-subnet-group',
      // Security groups MUST be deleted in this order due to ingress rule dependencies:
      // ALB SG first (no dependencies on it), ECS SG second (references ALB), RDS SG last (references ECS)
      securityGroups: ['java-bench-alb-sg', 'java-bench-ecs-sg', 'java-bench-rds-sg'],
      iamRole: 'ecsTaskExecutionRole'
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isNotFoundError(error) {
    const msg = (error?.message || '').toLowerCase();
    const name = (error?.name || '').toLowerCase();
    const code = (error?.Code || error?.code || '').toLowerCase();

    return (
      msg.includes('not found') ||
      msg.includes('does not exist') ||
      name.includes('notfound') ||
      code.includes('notfound') ||
      code.includes('nosuchentity')
    );
  }

  async waitForServiceInactive(ecsClient, cluster, service, maxWaitSeconds = 180) {
    const maxAttempts = Math.ceil(maxWaitSeconds / 6);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ecsClient.send(new DescribeServicesCommand({
          cluster,
          services: [service]
        }));

        const svc = response.services?.[0];
        const missing = !svc || svc.status === 'INACTIVE';
        if (missing) {
          this.log(chalk.green('✓ ECS service is inactive'));
          return true;
        }
      } catch (error) {
        if (this.isNotFoundError(error)) {
          this.log(chalk.green('✓ ECS service is inactive'));
          return true;
        }
      }

      this.log(chalk.gray(`  ⏳ Waiting for ECS service deletion (${attempt}/${maxAttempts})...`));
      await this.sleep(6000);
    }

    this.log(chalk.yellow('⚠️  ECS service is still deleting; continue cleanup with best effort'));
    return false;
  }

  async waitForAlbDeleted(elbClient, albName, maxWaitSeconds = 180) {
    const maxAttempts = Math.ceil(maxWaitSeconds / 6);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await elbClient.send(new DescribeLoadBalancersCommand({ Names: [albName] }));
        if (!response.LoadBalancers || response.LoadBalancers.length === 0) {
          this.log(chalk.green('✓ ALB deleted'));
          return true;
        }
      } catch (error) {
        if (this.isNotFoundError(error)) {
          this.log(chalk.green('✓ ALB deleted'));
          return true;
        }
      }

      this.log(chalk.gray(`  ⏳ Waiting for ALB deletion (${attempt}/${maxAttempts})...`));
      await this.sleep(6000);
    }

    this.log(chalk.yellow('⚠️  ALB still deleting; target group deletion may need rerun'));
    return false;
  }

  async waitForRdsDeleted(rdsClient, dbIdentifier, maxWaitSeconds = 600) {
    const maxAttempts = Math.ceil(maxWaitSeconds / 10);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));

        const instance = response.DBInstances?.[0];
        if (!instance) {
          this.log(chalk.green('✓ RDS instance deleted'));
          return true;
        }

        const status = instance.DBInstanceStatus || 'unknown';
        this.log(chalk.gray(`  ⏳ Waiting for RDS deletion (${attempt}/${maxAttempts})... status=${status}`));
      } catch (error) {
        if (this.isNotFoundError(error)) {
          this.log(chalk.green('✓ RDS instance deleted'));
          return true;
        }
        this.log(chalk.gray(`  ⏳ Waiting for RDS deletion (${attempt}/${maxAttempts})...`));
      }

      await this.sleep(10000);
    }

    this.log(chalk.yellow('⚠️  RDS instance still deleting; subnet group deletion may need rerun'));
    return false;
  }

  async cleanupEcs(ecsClient) {
    this.log(chalk.cyan('\n🧹 Cleaning ECS...'));

    try {
      const serviceArns = [];
      let nextToken;

      do {
        const services = await ecsClient.send(new ListServicesCommand({
          cluster: this.names.cluster,
          nextToken
        }));
        serviceArns.push(...(services.serviceArns || []));
        nextToken = services.nextToken;
      } while (nextToken);

      const existingServiceNames = serviceArns
        .map((arn) => arn.split('/').pop())
        .filter(Boolean);

      if (existingServiceNames.length > 0) {
        this.log(chalk.cyan(`  Found services: ${existingServiceNames.join(', ')}`));

        const expectedMissing = this.names.services.filter((name) => !existingServiceNames.includes(name));
        if (expectedMissing.length > 0) {
          this.log(chalk.gray(`  ⊙ Expected services not found: ${expectedMissing.join(', ')}`));
        }

        await Promise.all(existingServiceNames.map(async (serviceName) => {
          try {
            await ecsClient.send(new UpdateServiceCommand({
              cluster: this.names.cluster,
              service: serviceName,
              desiredCount: 0
            }));
          } catch (error) {
            if (!this.isNotFoundError(error)) throw error;
          }

          await ecsClient.send(new DeleteServiceCommand({
            cluster: this.names.cluster,
            service: serviceName,
            force: true
          }));
        }));

        this.log(chalk.green(`✓ Delete requested for services: ${existingServiceNames.join(', ')}`));

        await Promise.all(existingServiceNames.map((serviceName) =>
          this.waitForServiceInactive(ecsClient, this.names.cluster, serviceName)
        ));
      } else {
        this.log(chalk.gray('  ⊙ Target ECS services not found (skip)'));
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ ECS cluster not found (skip service cleanup)'));
      } else {
        throw error;
      }
    }

    try {
      const defs = await ecsClient.send(new ListTaskDefinitionsCommand({
        familyPrefix: this.names.taskFamilyPrefix,
        status: 'ACTIVE',
        sort: 'DESC'
      }));

      if (defs.taskDefinitionArns?.length) {
        for (const arn of defs.taskDefinitionArns) {
          await ecsClient.send(new DeregisterTaskDefinitionCommand({ taskDefinition: arn }));
        }
        this.log(chalk.green(`✓ Deregistered ${defs.taskDefinitionArns.length} active task definition(s)`));
      } else {
        this.log(chalk.gray('  ⊙ No active task definitions found (skip)'));
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ No task definitions found (skip)'));
      } else {
        throw error;
      }
    }

    try {
      await ecsClient.send(new DeleteClusterCommand({ cluster: this.names.cluster }));
      this.log(chalk.green('✓ ECS cluster delete requested'));
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ ECS cluster not found (skip)'));
      } else if ((error?.message || '').includes('contains services')) {
        this.log(chalk.yellow('⚠️  ECS cluster still has services/tasks; rerun cleanup shortly'));
      } else {
        throw error;
      }
    }
  }

  async cleanupAlb(elbClient) {
    this.log(chalk.cyan('\n🧹 Cleaning Load Balancer...'));

    let albFound = false;
    try {
      const alb = await elbClient.send(new DescribeLoadBalancersCommand({ Names: [this.names.alb] }));
      if (alb.LoadBalancers?.length) {
        albFound = true;
        const albArn = alb.LoadBalancers[0].LoadBalancerArn;

        await elbClient.send(new DeleteLoadBalancerCommand({ LoadBalancerArn: albArn }));
        this.log(chalk.green('✓ ALB delete requested'));
        await this.waitForAlbDeleted(elbClient, this.names.alb);
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ ALB not found (skip)'));
      } else {
        throw error;
      }
    }

    try {
      // Delete all target groups
      for (const tgName of this.names.targetGroups) {
        try {
          const tgs = await elbClient.send(new DescribeTargetGroupsCommand({ Names: [tgName] }));
          if (tgs.TargetGroups?.length) {
            const tgArn = tgs.TargetGroups[0].TargetGroupArn;
            await elbClient.send(new DeleteTargetGroupCommand({ TargetGroupArn: tgArn }));
            this.log(chalk.green(`✓ Target group deleted: ${tgName}`));
          }
        } catch (tgError) {
          if (this.isNotFoundError(tgError)) {
            this.log(chalk.gray(`  ⊙ Target group not found: ${tgName}`));
          } else if ((tgError?.message || '').toLowerCase().includes('in use')) {
            this.log(chalk.yellow(`⚠️  Target group still in use: ${tgName}; rerun cleanup shortly`));
          } else {
            this.log(chalk.yellow(`⚠️  Could not delete target group ${tgName}: ${tgError.message}`));
          }
        }
      }
    } catch (error) {
      this.log(chalk.yellow(`⚠️  Error during target group cleanup: ${error.message}`));
    }
  }

  async cleanupRds(rdsClient) {
    this.log(chalk.cyan('\n🧹 Cleaning RDS...'));

    let dbExists = false;
    try {
      const db = await rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: this.names.db }));
      dbExists = !!db.DBInstances?.length;
    } catch (error) {
      if (!this.isNotFoundError(error)) throw error;
    }

    if (dbExists) {
      try {
        await rdsClient.send(new DeleteDBInstanceCommand({
          DBInstanceIdentifier: this.names.db,
          SkipFinalSnapshot: true,
          DeleteAutomatedBackups: true
        }));
        this.log(chalk.green('✓ RDS instance delete requested'));
      } catch (error) {
        if ((error?.message || '').toLowerCase().includes('deleting')) {
          this.log(chalk.gray('  ⊙ RDS instance already deleting (skip)'));
        } else {
          throw error;
        }
      }

      await this.waitForRdsDeleted(rdsClient, this.names.db);
    } else {
      this.log(chalk.gray('  ⊙ RDS instance not found (skip)'));
    }

    try {
      const subnetGroups = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: this.names.dbSubnetGroup
      }));

      if (subnetGroups.DBSubnetGroups?.length) {
        await rdsClient.send(new DeleteDBSubnetGroupCommand({
          DBSubnetGroupName: this.names.dbSubnetGroup
        }));
        this.log(chalk.green('✓ DB subnet group deleted'));
      }
    } catch (error) {
      const message = (error?.message || '').toLowerCase();
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ DB subnet group not found (skip)'));
      } else if (message.includes('in use') || message.includes('still using') || message.includes('cannot delete the subnet group')) {
        this.log(chalk.yellow('⚠️  DB subnet group still in use; rerun cleanup after DB is deleted'));
      } else {
        throw error;
      }
    }
  }

  async cleanupSecurityGroups(ec2Client) {
    this.log(chalk.cyan('\n🧹 Cleaning Security Groups...'));

    try {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: this.names.securityGroups }]
      }));

      const foundGroups = response.SecurityGroups || [];
      if (!foundGroups.length) {
        this.log(chalk.gray('  ⊙ No benchmark security groups found (skip)'));
        return;
      }

      for (const groupName of this.names.securityGroups) {
        const group = foundGroups.find((g) => g.GroupName === groupName);
        if (!group) {
          this.log(chalk.gray(`  ⊙ ${groupName} not found (skip)`));
          continue;
        }

        try {
          await ec2Client.send(new DeleteSecurityGroupCommand({ GroupId: group.GroupId }));
          this.log(chalk.green(`✓ Security group deleted: ${groupName}`));
        } catch (error) {
          const errorMsg = (error?.message || '').toLowerCase();
          if (errorMsg.includes('in use') || errorMsg.includes('dependent object') || errorMsg.includes('dependency violation')) {
            this.log(chalk.yellow(`⚠️  Security group has dependencies: ${groupName}`));
            this.log(chalk.yellow(`    (AWS may still be cleaning up network interfaces. Try again in a few minutes)`));
          } else if (this.isNotFoundError(error)) {
            this.log(chalk.gray(`  ⊙ Security group already gone: ${groupName}`));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ No benchmark security groups found (skip)'));
      } else {
        throw error;
      }
    }
  }

  async cleanupIamRole(iamClient) {
    this.log(chalk.cyan('\n🧹 Cleaning IAM Role...'));

    try {
      await iamClient.send(new GetRoleCommand({ RoleName: this.names.iamRole }));
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.log(chalk.gray('  ⊙ IAM role not found (skip)'));
        return;
      }
      throw error;
    }

    try {
      const attached = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: this.names.iamRole }));
      for (const policy of attached.AttachedPolicies || []) {
        await iamClient.send(new DetachRolePolicyCommand({
          RoleName: this.names.iamRole,
          PolicyArn: policy.PolicyArn
        }));
      }

      const inline = await iamClient.send(new ListRolePoliciesCommand({ RoleName: this.names.iamRole }));
      for (const policyName of inline.PolicyNames || []) {
        await iamClient.send(new DeleteRolePolicyCommand({
          RoleName: this.names.iamRole,
          PolicyName: policyName
        }));
      }

      await iamClient.send(new DeleteRoleCommand({ RoleName: this.names.iamRole }));
      this.log(chalk.green('✓ IAM role deleted: ecsTaskExecutionRole'));
    } catch (error) {
      if ((error?.message || '').toLowerCase().includes('cannot be deleted')) {
        this.log(chalk.yellow('⚠️  IAM role still in use; rerun cleanup after ECS tasks stop'));
      } else {
        throw error;
      }
    }
  }

  async run() {
    await this.parse(AwsCleanupCommand);

    this.log(chalk.bold.cyan('\n🗑️  AWS Cleanup for Benchmark Resources\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'awsRegion',
        message: 'AWS Region',
        default: 'us-east-1'
      },
      {
        type: 'confirm',
        name: 'deleteIamRole',
        message: 'Also delete IAM role "ecsTaskExecutionRole"?',
        default: false
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with cleanup of benchmark AWS resources?',
        default: false
      }
    ]);

    if (!answers.confirm) {
      this.log(chalk.yellow('Cleanup cancelled.'));
      return;
    }

    this.region = answers.awsRegion;

    const ecsClient = new ECSClient({ region: this.region });
    const elbClient = new ElasticLoadBalancingV2Client({ region: this.region });
    const rdsClient = new RDSClient({ region: this.region });
    const ec2Client = new EC2Client({ region: this.region });
    const iamClient = new IAMClient({ region: this.region });

    try {
      await this.cleanupEcs(ecsClient);
      await this.cleanupAlb(elbClient);
      await this.cleanupRds(rdsClient);
      await this.cleanupSecurityGroups(ec2Client);

      if (answers.deleteIamRole) {
        await this.cleanupIamRole(iamClient);
      } else {
        this.log(chalk.gray('\n⊙ IAM role cleanup skipped')); 
      }

      this.log(chalk.bold.green('\n✓ Cleanup completed (best effort).\n'));
      this.log(chalk.gray('If any resource was still "in use", run `npm run aws-cleanup` again in a few minutes.'));
    } catch (error) {
      this.error(chalk.red(`Cleanup failed: ${error.message || error}`));
    }
  }
}

module.exports = AwsCleanupCommand;

if (require.main === module) {
  AwsCleanupCommand.run().catch(require('@oclif/core').handle);
}
