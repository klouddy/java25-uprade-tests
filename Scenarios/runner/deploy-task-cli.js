#!/usr/bin/env node

const { Command, Flags } = require('@oclif/core');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const DeployTask = require('./deploy-task');

class DeployTaskCommand extends Command {
  static description = 'Deploy a task definition to ECS service';

  static flags = {
    help: Flags.help({ description: 'show CLI help' }),
    verbose: Flags.boolean({ description: 'verbose output', default: false })
  };

  static examples = [
    `$ npm run deploy-task
Select a run configuration and deploy its task to ECS
    `,
    `$ npm run deploy-task -- --verbose
Same as above with detailed output
    `
  ];

  findRunConfigs(projectRoot) {
    const runsDir = path.join(projectRoot, 'runs', 'Scenarios');
    const configs = [];

    if (!fs.existsSync(runsDir)) {
      return configs;
    }

    // Recursively find all run_config.json files
    const walkDir = (dir, depth = 0) => {
      if (depth > 10) return; // Prevent infinite recursion

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isFile() && entry.name === 'run_config.json') {
            try {
              const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
              const taskDefPath = path.join(path.dirname(fullPath), 'task-definition.json');
              
              // Only include REST configs that have task definitions
              if (config.scenarioType === 'REST' && fs.existsSync(taskDefPath)) {
                const stat = fs.statSync(fullPath);
                configs.push({
                  name: fullPath,
                  config: config,
                  runDir: path.dirname(fullPath),
                  timestamp: stat.mtime,
                  display: `${config.scenario} • Java ${config.javaVersion} • ${config.timestamp}`
                });
              }
            } catch (e) {
              // Skip invalid config files
            }
          } else if (entry.isDirectory()) {
            walkDir(fullPath, depth + 1);
          }
        }
      } catch (e) {
        // Skip directories we can't read
      }
    };

    walkDir(runsDir);

    // Sort by timestamp (newest first)
    configs.sort((a, b) => b.timestamp - a.timestamp);

    return configs;
  }

  async run() {
    const { flags } = await this.parse(DeployTaskCommand);

    this.log(chalk.bold.cyan('\n🎯 Deploy Task Definition to ECS\n'));

    try {
      const projectRoot = path.resolve(__dirname, '..', '..');

      // Find all run configurations
      const configs = this.findRunConfigs(projectRoot);

      if (configs.length === 0) {
        this.log(chalk.yellow('⚠️  No run configurations found'));
        this.log(chalk.gray('Run "npm run setup" first to create a benchmark run configuration'));
        return;
      }

      // Let user choose which run to deploy
      const choices = configs.map(c => ({
        name: c.display,
        value: c,
        short: `${c.config.scenario} (Java ${c.config.javaVersion})`
      }));

      const { selectedRun } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedRun',
          message: 'Select a run configuration to deploy (most recent first):',
          choices: choices,
          pageSize: 10
        }
      ]);

      const runDir = selectedRun.runDir;
      const config = selectedRun.config;

      this.log(chalk.cyan(`\n🔧 Deploying Task Definition\n`));
      this.log(`Configuration: ${chalk.cyan(config.scenario)} • Java ${chalk.cyan(config.javaVersion)}`);
      this.log(`Run directory: ${chalk.cyan(runDir)}\n`);

      // Prompt for deployment configuration
      const deployAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'awsRegion',
          message: 'AWS Region',
          default: 'us-east-1'
        },
        {
          type: 'input',
          name: 'clusterName',
          message: 'ECS Cluster Name',
          default: 'java-bench-cluster'
        },
        {
          type: 'input',
          name: 'serviceName',
          message: 'ECS Service Name',
          default: 'java-bench-service'
        },
        {
          type: 'confirm',
          name: 'forceNewDeployment',
          message: 'Force new deployment of tasks?',
          default: true
        }
      ]);

      const deployConfig = {
        awsRegion: deployAnswers.awsRegion,
        clusterName: deployAnswers.clusterName,
        serviceName: deployAnswers.serviceName,
        forceNewDeployment: deployAnswers.forceNewDeployment
      };

      // Run task deployment
      try {
        const deployTask = new DeployTask(this.log.bind(this), chalk);
        const result = await deployTask.deployTaskDefinition(deployConfig, runDir, projectRoot);
        
        this.log(chalk.cyan('Next steps:'));
        this.log('1. Monitor task deployment in AWS Console (ECS → Clusters)');
        this.log('2. Check CloudWatch logs for your application');
        this.log('3. Verify the ALB target health');
        this.log('4. Re-run benchmarks if needed\n');
      } catch (error) {
        this.error(chalk.red(`Task deployment failed: ${error.message}`));
      }

    } catch (error) {
      if (error.isTtyError) {
        this.error(chalk.red('CLI requires an interactive terminal'));
      } else {
        this.error(chalk.red(`Error: ${error.message}`));
      }
    }
  }
}

DeployTaskCommand.description = 'Deploy a task definition to ECS service';

module.exports = DeployTaskCommand;

// Execute if run directly
if (require.main === module) {
  DeployTaskCommand.run().catch(require('@oclif/core').handle);
}
