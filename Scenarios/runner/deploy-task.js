const fs = require('fs');
const path = require('path');

const {
  ECSClient,
  RegisterTaskDefinitionCommand,
  DescribeServicesCommand,
  UpdateServiceCommand,
  ListServicesCommand
} = require('@aws-sdk/client-ecs');

const {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  DescribeLogGroupsCommand
} = require('@aws-sdk/client-cloudwatch-logs');

class DeployTask {
  constructor(logFn, chalk) {
    this.log = logFn;
    this.chalk = chalk;
    this.region = 'us-east-1';
  }

  async deployTaskDefinition(deployConfig, runDir, projectRoot) {
    this.region = deployConfig.awsRegion || 'us-east-1';
    
    this.log(this.chalk.bold('\n📦 Deploying New Task Definition\n'));
    this.log(this.chalk.cyan('Initializing AWS SDK clients...'));

    try {
      const ecsClient = new ECSClient({ region: this.region });
      const logsClient = new CloudWatchLogsClient({ region: this.region });

      // Read task definition from run directory
      const taskDefPath = path.join(runDir, 'task-definition.json');
      if (!fs.existsSync(taskDefPath)) {
        throw new Error(`Task definition not found at ${taskDefPath}`);
      }

      const taskDefContent = fs.readFileSync(taskDefPath, 'utf8');
      const taskDef = JSON.parse(taskDefContent);

      this.log(this.chalk.cyan(`\n📋 Task Definition: ${taskDef.family || 'unknown'}`));
      this.log(this.chalk.cyan(`   CPU: ${taskDef.cpu} units`));
      this.log(this.chalk.cyan(`   Memory: ${taskDef.memory} MB`));
      this.log(this.chalk.cyan(`   Containers: ${taskDef.containerDefinitions?.length || 0}`));

      // Ensure log groups exist before registering task
      if (taskDef.containerDefinitions) {
        for (const container of taskDef.containerDefinitions) {
          if (container.logConfiguration?.options?.['awslogs-group']) {
            const logGroupName = container.logConfiguration.options['awslogs-group'];
            try {
              const logGroups = await logsClient.send(new DescribeLogGroupsCommand({
                logGroupNamePrefix: logGroupName
              }));

              if (!logGroups.logGroups || logGroups.logGroups.length === 0) {
                this.log(this.chalk.cyan(`  Creating log group: ${logGroupName}...`));
                try {
                  await logsClient.send(new CreateLogGroupCommand({
                    logGroupName: logGroupName
                  }));
                  this.log(this.chalk.green(`  ✓ Log group created`));
                } catch (error) {
                  if (!error.message.includes('already exists')) {
                    this.log(this.chalk.yellow(`  ⚠️  Could not create log group: ${error.message}`));
                  }
                }
              } else {
                this.log(this.chalk.gray(`  ⊙ Log group already exists: ${logGroupName}`));
              }
            } catch (error) {
              this.log(this.chalk.yellow(`  ⚠️  Could not check log group: ${error.message}`));
            }
          }
        }
      }

      // Register new task definition
      this.log(this.chalk.cyan('\n📝 Registering task definition...'));
      let taskDefArn;
      try {
        const registerResponse = await ecsClient.send(new RegisterTaskDefinitionCommand({
          family: taskDef.family,
          containerDefinitions: taskDef.containerDefinitions,
          cpu: taskDef.cpu,
          memory: taskDef.memory,
          networkMode: taskDef.networkMode,
          requiresCompatibilities: taskDef.requiresCompatibilities,
          executionRoleArn: taskDef.executionRoleArn,
          taskRoleArn: taskDef.taskRoleArn
        }));
        
        taskDefArn = registerResponse.taskDefinition.taskDefinitionArn;
        this.log(this.chalk.green(`✓ Task definition registered: ${taskDef.family}:${registerResponse.taskDefinition.revision}`));
      } catch (regError) {
        const regErrorMsg = regError.message || regError.__type || JSON.stringify(regError);
        throw new Error(`Failed to register task definition: ${regErrorMsg}`);
      }

      // Update ECS service with new task definition
      const clusterName = deployConfig.clusterName || 'java-bench-cluster';
      const serviceName = deployConfig.serviceName || 'java-bench-service';

      this.log(this.chalk.cyan(`\n🚀 Updating ECS service...`));
      this.log(this.chalk.cyan(`   Cluster: ${clusterName}`));
      this.log(this.chalk.cyan(`   Service: ${serviceName}`));

      try {
        // Check if service exists
        const servicesResponse = await ecsClient.send(new ListServicesCommand({
          cluster: clusterName
        }));

        const serviceExists = servicesResponse.serviceArns && 
          servicesResponse.serviceArns.some(arn => arn.includes(serviceName));

        if (!serviceExists) {
          this.log(this.chalk.yellow(`⚠️  Service '${serviceName}' not found in cluster '${clusterName}'`));
          this.log(this.chalk.gray('Available services:'));
          if (servicesResponse.serviceArns && servicesResponse.serviceArns.length > 0) {
            servicesResponse.serviceArns.forEach(arn => {
              const name = arn.split('/').pop();
              this.log(this.chalk.gray(`   • ${name}`));
            });
          } else {
            this.log(this.chalk.gray('   (none)'));
          }
          throw new Error(`Service ${serviceName} not found`);
        }

        // Update the service
        const updateResponse = await ecsClient.send(new UpdateServiceCommand({
          cluster: clusterName,
          service: serviceName,
          taskDefinition: taskDefArn,
          forceNewDeployment: true
        }));

        this.log(this.chalk.green('✓ Service updated with new task definition'));
        this.log(this.chalk.green(`✓ Desired count: ${updateResponse.service?.desiredCount}`));
        this.log(this.chalk.green(`✓ Running count: ${updateResponse.service?.runningCount}`));
      } catch (serviceError) {
        const serviceErrorMsg = serviceError.message || serviceError.__type || JSON.stringify(serviceError);
        throw new Error(`Failed to update service: ${serviceErrorMsg}`);
      }

      // Wait a moment for service update to register
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify service health
      try {
        const servicesResponse = await ecsClient.send(new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName]
        }));

        const service = servicesResponse.services?.[0];
        if (service) {
          this.log(this.chalk.cyan('\n📊 Service Status:'));
          this.log(this.chalk.cyan(`   Desired tasks: ${service.desiredCount}`));
          this.log(this.chalk.cyan(`   Running tasks: ${service.runningCount}`));
          this.log(this.chalk.cyan(`   Status: ${service.status}`));
          
          if (service.taskDefinition) {
            const taskDefName = service.taskDefinition.split('/').pop();
            this.log(this.chalk.cyan(`   Active task definition: ${taskDefName}`));
          }

          if (service.deployments && service.deployments.length > 0) {
            this.log(this.chalk.cyan(`\n   Deployments:`));
            service.deployments.forEach((dep, idx) => {
              const depStatus = dep.status === 'PRIMARY' ? '🔵 PRIMARY' : '⚪ SECONDARY';
              this.log(this.chalk.cyan(`     ${depStatus} (${dep.runningCount}/${dep.desiredCount} running)`));
            });
          }
        }
      } catch (statusError) {
        this.log(this.chalk.yellow(`⚠️  Could not fetch final service status: ${statusError.message}`));
      }

      this.log(this.chalk.bold.green('\n✓ Task Deployment Completed Successfully!\n'));

      return {
        status: 'success',
        taskDefArn,
        clusterName,
        serviceName,
        message: 'Task definition registered and service updated'
      };

    } catch (error) {
      throw new Error(`Task deployment failed: ${error.message}`);
    }
  }
}

module.exports = DeployTask;
