#!/usr/bin/env node

const { Command, Flags } = require('@oclif/core');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const AwsBootstrap = require('./aws-bootstrap');

class AwsBootstrapCommand extends Command {
  static description = 'Deploy AWS infrastructure for a completed benchmark run';

  static flags = {
    help: Flags.help({ description: 'show CLI help' }),
    verbose: Flags.boolean({ description: 'verbose output', default: false })
  };

  static examples = [
    `$ npm run aws-bootstrap
Select a run configuration and deploy AWS infrastructure
    `,
    `$ npm run aws-bootstrap -- --verbose
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
    const { flags } = await this.parse(AwsBootstrapCommand);

    this.log(chalk.bold.cyan('\n🚀 AWS Bootstrap for Benchmark Runs\n'));

    try {
      const projectRoot = path.resolve(__dirname, '..', '..');

      // Find all run configurations
      const configs = this.findRunConfigs(projectRoot);

      if (configs.length === 0) {
        this.log(chalk.yellow('⚠️  No run configurations found'));
        this.log(chalk.gray('Run "npm run setup" first to create a benchmark run configuration'));
        return;
      }

      // Let user choose which run to bootstrap
      const choices = configs.map(c => ({
        name: c.display,
        value: c,
        short: `${c.config.scenario} (Java ${c.config.javaVersion})`
      }));

      const { selectedRun } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedRun',
          message: 'Select a run configuration to bootstrap (most recent first):',
          choices: choices,
          pageSize: 10
        }
      ]);

      const runDir = selectedRun.runDir;
      const config = selectedRun.config;

      this.log(chalk.cyan(`\n🔧 Configuring AWS Infrastructure\n`));
      this.log(`Configuration: ${chalk.cyan(config.scenario)} • Java ${chalk.cyan(config.javaVersion)}`);
      this.log(`Run directory: ${chalk.cyan(runDir)}\n`);

      // Prompt for AWS configuration
      const awsAnswers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'awsComponents',
          message: 'Which AWS components to set up?',
          choices: [
            { name: 'ECS Fargate Cluster', value: 'ecs', checked: true },
            { name: 'RDS PostgreSQL Database', value: 'rds', checked: true },
            { name: 'Application Load Balancer', value: 'alb', checked: true },
            { name: 'Prometheus Monitoring', value: 'prometheus', checked: false }
          ]
        },
        {
          type: 'input',
          name: 'awsRegion',
          message: 'AWS Region',
          default: 'us-east-1'
        },
        {
          type: 'input',
          name: 'dbPassword',
          message: 'RDS Database password',
          default: 'BenchUserStrongPass123!',
          mask: '*'
        }
      ]);

      const bootstrapConfig = {
        enabled: true,
        components: awsAnswers.awsComponents,
        awsRegion: awsAnswers.awsRegion,
        dbPassword: awsAnswers.dbPassword
      };

      // Get image path from task definition
      let imageFullPath = null;
      const taskDefPath = path.join(runDir, 'task-definition.json');
      if (fs.existsSync(taskDefPath)) {
        try {
          const taskDef = JSON.parse(fs.readFileSync(taskDefPath, 'utf8'));
          if (taskDef.containerDefinitions && taskDef.containerDefinitions.length > 0) {
            imageFullPath = taskDef.containerDefinitions[0].image;
          }
        } catch (e) {
          // Will use default
        }
      }

      if (!imageFullPath) {
        this.log(chalk.yellow('⚠️  Could not find Docker image path in task definition'));
        return;
      }

      // Run AWS bootstrap
      try {
        const awsBootstrap = new AwsBootstrap(this.log.bind(this), chalk);
        await awsBootstrap.setupInfrastructure(bootstrapConfig, imageFullPath, projectRoot, runDir);
        
        this.log(chalk.bold.green('\n✓ AWS Bootstrap Completed Successfully!\n'));
        this.log(chalk.cyan('Next steps:'));
        this.log('1. Monitor task deployment in AWS Console (ECS → Clusters)');
        this.log('2. Check CloudWatch logs for your application');
        this.log('3. Run the k6 load test scenarios against the ALB endpoint');
        this.log('4. Update README.md with benchmark results\n');
      } catch (error) {
        this.error(chalk.red(`AWS bootstrap failed: ${error.message}`));
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

AwsBootstrapCommand.description = 'Deploy AWS infrastructure for a benchmark run';

module.exports = AwsBootstrapCommand;

// Execute if run directly
if (require.main === module) {
  AwsBootstrapCommand.run().catch(require('@oclif/core').handle);
}
