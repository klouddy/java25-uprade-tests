#!/usr/bin/env node

const { Command, Flags } = require('@oclif/core');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { execSync } = require('child_process');

class SetupRunCommand extends Command {
  static description = 'Configure a new benchmark run with interactive prompts';

  static flags = {
    help: Flags.help({ description: 'show CLI help' }),
    verbose: Flags.boolean({ description: 'verbose output', default: false })
  };

  static examples = [
    `$ benchmark-runner setup
Interactive prompts will guide you through configuration
    `,
    `$ benchmark-runner setup --verbose
Same as above with detailed output
    `
  ];

  static SCENARIO_MAP = {
    'Read Heavy': 1,
    'Balanced': 2,
    'Write Heavy': 3,
    'Ramp Up': 4,
    'Burst Spike': 5,
    'Cold Start': 6,
    'Warm Start': 7
  };

  static ECR_REGISTRY = '913846010507.dkr.ecr.us-east-1.amazonaws.com';
  static ECR_REPOSITORY = 'benchmark-app';

  formatScenarioName(scenario) {
    return scenario.toLowerCase().replace(/ /g, '-');
  }

  getNextRunNumber(baseDir) {
    if (!fs.existsSync(baseDir)) {
      return 1;
    }
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const numbers = entries
      .filter(e => e.isDirectory())
      .map(e => parseInt(e.name))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);
    return numbers.length > 0 ? numbers[0] + 1 : 1;
  }

  createApplicationYamlTemplate(config) {
    return `spring:
  application:
    name: spring-boot-benchmark

  threads:
    virtual:
      enabled: ${config.virtualThreadsEnabled}

  datasource:
    url: \${DATABASE_URL:jdbc:postgresql://localhost:5432/benchmark}
    username: \${DATABASE_USER:postgres}
    password: \${DATABASE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: \${DB_POOL_SIZE:${config.dbPoolSize}}
      minimum-idle: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: false
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

server:
  port: \${SERVER_PORT:8080}
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
  tomcat:
    threads:
      max: \${TOMCAT_MAX_THREADS:200}
      min-spare: 10
    max-connections: 10000
    accept-count: 100

management:
  endpoints:
    web:
      exposure:
        include: metrics,prometheus,health
  metrics:
    export:
      prometheus:
        enabled: true
`;
  }

  createMarkdownTemplate(config) {
    const timestamp = new Date().toISOString();
    return `# Benchmark Run Configuration

**Generated**: ${timestamp}

## Scenario Settings

| Setting | Value |
|---------|-------|
| Scenario Type | ${config.scenarioType} |
| Load Test Scenario | ${config.scenario} |
| Java Version | ${config.javaVersion} |
| Virtual Threads Enabled | ${config.virtualThreadsEnabled} |
| DB Pool Size | ${config.dbPoolSize} |

## Infrastructure Settings

| Setting | Value |
|---------|-------|
| CPU (units) | ${config.cpu} |
| Memory (MB) | ${config.memory} |

## JVM Options

\`\`\`
${config.jvmOptions || '(default)'}
\`\`\`

## Docker Image

- **Image Name**: ${config.dockerImage || 'pending'}
- **Dockerfile**: [Dockerfile](./Dockerfile)
- **Build Date**: ${timestamp}

## ECS Task Definition

- **Task Definition**: [task-definition.json](./task-definition.json)
- **Task CPU**: ${config.cpu} units
- **Task Memory**: ${config.memory} MB

## AWS Bootstrap

- **Status**: Pending
- **Command**: \`npm run aws-bootstrap\`
- **ECS Cluster**: java-bench-cluster
- **RDS Database**: java-bench-db (PostgreSQL)
- **ALB Endpoint**: [Check AWS Console]

## Results

### K6 Load Test Results

- **Status**: Pending
- **Total Requests**: -
- **Throughput (RPS)**: -
- **Error Rate (%)**: -
- **Avg Latency (ms)**: -
- **p90 Latency (ms)**: -
- **p95 Latency (ms)**: -
- **p99 Latency (ms)**: -

### Container Metrics (ECS Container Insights)

- **Avg CPU (units)**: -
- **Max CPU (units)**: -
- **Avg Memory (MB)**: -
- **Max Memory (MB)**: -

### Database Metrics (RDS CloudWatch)

- **Avg Connections**: -
- **Max Connections**: -
- **CPU Utilization (%)**: -
- **Read Latency (ms)**: -

### JVM Metrics (Prometheus)

- **Heap Used (avg/max)**: - / - MB
- **GC Pause Count**: -
- **GC Total Pause Time**: - ms

## Notes

Add observations and findings here.
`;
  }

  readDockerfileTemplate(javaVersion, appRoot) {
    let dockerfileName;
    if (javaVersion === 'GraalVM') {
      dockerfileName = 'Dockerfile.graalvm';
    } else {
      dockerfileName = `Dockerfile.java${javaVersion}`;
    }
    
    const dockerfilePath = path.join(appRoot, 'Scenarios', 'REST', 'spring-boot-app', dockerfileName);
    if (!fs.existsSync(dockerfilePath)) {
      throw new Error(`Dockerfile for ${javaVersion} not found at ${dockerfilePath}`);
    }
    return fs.readFileSync(dockerfilePath, 'utf8');
  }

  modifyDockerfileWithJvmOptions(dockerfileContent, jvmOptions) {
    // Find the line with JAVA_TOOL_OPTIONS ENV and replace it
    const lines = dockerfileContent.split('\n');
    const modifiedLines = lines.map(line => {
      // Only replace lines that START with ENV and contain JAVA_TOOL_OPTIONS
      // This avoids matching ENTRYPOINT which references $JAVA_TOOL_OPTIONS
      if ((line.startsWith('ENV JAVA_TOOL_OPTIONS') || line.startsWith('ENV _JAVA_OPTIONS'))) {
        return `ENV JAVA_TOOL_OPTIONS="${jvmOptions}"`;
      }
      return line;
    });
    
    // If no JAVA_TOOL_OPTIONS ENV found, add it before EXPOSE
    if (!modifiedLines.some(line => line.startsWith('ENV JAVA_TOOL_OPTIONS') || line.startsWith('ENV _JAVA_OPTIONS'))) {
      const exposeIndex = modifiedLines.findIndex(line => line.startsWith('EXPOSE'));
      if (exposeIndex !== -1) {
        modifiedLines.splice(exposeIndex, 0, `ENV JAVA_TOOL_OPTIONS="${jvmOptions}"\n`);
      }
    }
    
    return modifiedLines.join('\n');
  }

  buildDockerImage(dockerfilePath, imageTag, imageFullPath, appRoot) {
    const appPath = path.join(appRoot, 'Scenarios', 'REST', 'spring-boot-app');
    this.log(chalk.gray(`\nBuilding Podman image: ${imageTag}`));
    this.log(chalk.gray(`Working directory: ${appPath}`));
    
    try {
      execSync(`podman build -f "${dockerfilePath}" -t "${imageTag}" -t "${imageFullPath}" "${appPath}"`, {
        stdio: 'inherit',
        cwd: appPath
      });
      this.log(chalk.green(`✓ Podman image built successfully`));
      this.log(chalk.green(`  Local tag: ${imageTag}`));
      this.log(chalk.green(`  ECR path: ${imageFullPath}`));
      return true;
    } catch (error) {
      throw new Error(`Failed to build Podman image: ${error.message}`);
    }
  }

  pushImageToECR(imageFullPath) {
    this.log(chalk.gray(`\nPushing image to ECR: ${imageFullPath}`));
    
    try {
      execSync(`podman push "${imageFullPath}"`, {
        stdio: 'inherit'
      });
      this.log(chalk.green(`✓ Image pushed to ECR successfully`));
      return true;
    } catch (error) {
      throw new Error(`Failed to push image to ECR: ${error.message}`);
    }
  }



  readTaskDefinitionTemplate(appRoot) {
    const taskDefPath = path.join(appRoot, 'Scenarios', 'REST', 'spring-boot-app', 'task.json');
    if (!fs.existsSync(taskDefPath)) {
      throw new Error(`Task definition template not found at ${taskDefPath}`);
    }
    return JSON.parse(fs.readFileSync(taskDefPath, 'utf8'));
  }

  createTaskDefinition(templateTaskDef, config, dockerImage) {
    const taskDef = JSON.parse(JSON.stringify(templateTaskDef)); // Deep clone
    
    // Update container definition with new image and environment
    if (taskDef.containerDefinitions && taskDef.containerDefinitions.length > 0) {
      const container = taskDef.containerDefinitions[0];
      container.image = dockerImage;
      
      // Update environment variables
      if (!container.environment) {
        container.environment = [];
      }
      
      // Update or add environment variables
      const envVars = {
        'DB_POOL_SIZE': String(config.dbPoolSize),
        'APP_IMAGE': dockerImage,
        'JAVA_VERSION': config.javaVersion,
        'VIRTUAL_THREADS_ENABLED': String(config.virtualThreadsEnabled).toLowerCase()
      };
      
      for (const [key, value] of Object.entries(envVars)) {
        const existing = container.environment.find(e => e.name === key);
        if (existing) {
          existing.value = value;
        } else {
          container.environment.push({ name: key, value });
        }
      }
      
      // Update memory and CPU if specified at container level
      if (config.memory) {
        container.memory = config.memory;
      }
      if (config.cpu) {
        container.cpu = config.cpu;
      }
    }
    
    // Update task-level CPU and memory
    if (config.cpu) {
      taskDef.cpu = String(config.cpu);
    }
    if (config.memory) {
      taskDef.memory = String(config.memory);
    }
    
    return taskDef;
  }

  async run() {
    const { flags } = await this.parse(SetupRunCommand);

    this.log(chalk.bold.cyan('\n╔════════════════════════════════════════════╗'));
    this.log(chalk.bold.cyan('║   Benchmark Run Configuration Generator   ║'));
    this.log(chalk.bold.cyan('╚════════════════════════════════════════════╝\n'));

    try {
      // Collect user input
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'scenarioType',
          message: 'What scenario type are you running?',
          choices: ['REST', 'Kafka'],
          default: 'REST'
        },
        {
          type: 'list',
          name: 'scenario',
          message: 'Which load test scenario?',
          choices: [
            'Read Heavy',
            'Balanced',
            'Write Heavy',
            'Ramp Up',
            'Burst Spike',
            'Cold Start',
            'Warm Start'
          ],
          default: 'Read Heavy'
        },
        {
          type: 'list',
          name: 'javaVersion',
          message: 'Java version?',
          choices: ['17', '21', '25', 'GraalVM'],
          default: '25'
        },
        {
          type: 'input',
          name: 'jvmOptions',
          message: 'JVM options',
          default: (answers) => {
            if (answers.javaVersion === 'GraalVM') {
              return 'N/A (native image)'; // GraalVM native doesn't use JVM options
            }
            return '-XX:+UseG1GC -Xmx1024m';
          }
        },
        {
          type: 'input',
          name: 'cpu',
          message: 'CPU units (ECS)',
          default: (answers) => {
            // GraalVM typically needs less CPU due to instant startup
            return answers.javaVersion === 'GraalVM' ? '256' : '512';
          }
        },
        {
          type: 'input',
          name: 'memory',
          message: 'Memory (MB, ECS)',
          default: (answers) => {
            // GraalVM uses significantly less memory (50-70% reduction)
            return answers.javaVersion === 'GraalVM' ? '512' : '2048';
          }
        },
        {
          type: 'confirm',
          name: 'virtualThreadsEnabled',
          message: 'Virtual Threads enabled?',
          default: false
        },
        {
          type: 'input',
          name: 'dbPoolSize',
          message: 'Database pool size',
          default: '20'
        }
      ]);

      // Create config object
      const config = {
        timestamp: new Date().toISOString(),
        scenarioType: answers.scenarioType,
        scenario: answers.scenario,
        javaVersion: answers.javaVersion,
        jvmOptions: answers.jvmOptions,
        cpu: parseInt(answers.cpu),
        memory: parseInt(answers.memory),
        virtualThreadsEnabled: answers.virtualThreadsEnabled,
        dbPoolSize: parseInt(answers.dbPoolSize)
      };

      if (flags.verbose) {
        this.log(chalk.gray('\nConfiguration object created:\n'), config);
      }

      // Determine directory structure
      const scenarioName = this.formatScenarioName(answers.scenario);
      const dateStr = new Date().toISOString().split('T')[0];
      const projectRoot = path.resolve(__dirname, '..', '..');
      
      // Use 'graalvm' as folder name instead of 'javaXX' for GraalVM
      const javaVersionFolder = answers.javaVersion === 'GraalVM' ? 'graalvm' : `java${answers.javaVersion}`;
      
      const baseDir = path.join(
        projectRoot,
        'runs',
        'Scenarios',
        answers.scenarioType,
        scenarioName,
        javaVersionFolder,
        dateStr
      );
      const runNumber = this.getNextRunNumber(baseDir);
      const runDir = path.join(baseDir, String(runNumber));

      if (flags.verbose) {
        this.log(chalk.gray(`\nCreating directory: ${runDir}`));
      }

      // Create directories
      fs.mkdirSync(runDir, { recursive: true });

      // Create image tag: <REST|Kafka>-java<version>-<scenario#>-<date>-<runnum> or graalvm variant
      const scenarioNum = SetupRunCommand.SCENARIO_MAP[answers.scenario];
      const versionTag = answers.javaVersion === 'GraalVM' ? 'graalvm' : `java${answers.javaVersion}`;
      const imageTag = `benchmark-app:${answers.scenarioType.toLowerCase()}-${versionTag}-${scenarioNum}-${dateStr}-${runNumber}`;
      let imageFullPath = `${SetupRunCommand.ECR_REGISTRY}/${SetupRunCommand.ECR_REPOSITORY}:${answers.scenarioType.toLowerCase()}-${versionTag}-${scenarioNum}-${dateStr}-${runNumber}`;

      // For GraalVM, allow using a prebuilt image URI instead of building locally
      if (answers.javaVersion === 'GraalVM') {
        const imageAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'graalvmImageUri',
            message: 'Prebuilt GraalVM image URI (ECR) to use',
            default: imageFullPath
          }
        ]);
        if (imageAnswer.graalvmImageUri && imageAnswer.graalvmImageUri.trim().length > 0) {
          imageFullPath = imageAnswer.graalvmImageUri.trim();
        }
      }
      
      config.scenarioNumber = scenarioNum;
      config.dockerImage = imageFullPath;
      config.imageTag = imageTag;

      // Write config file first
      const configPath = path.join(runDir, 'run_config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Handle Docker and Task Definition for REST scenario
      if (answers.scenarioType === 'REST') {
        try {
          this.log(chalk.bold('\n🐳 Preparing container image configuration...\n'));

          // Read and modify Dockerfile
          const baseDockerfile = this.readDockerfileTemplate(answers.javaVersion, projectRoot);
          
          // Only modify JVM options for Java versions (not GraalVM native images)
          let modifiedDockerfile = baseDockerfile;
          if (answers.javaVersion !== 'GraalVM') {
            modifiedDockerfile = this.modifyDockerfileWithJvmOptions(
              baseDockerfile,
              answers.jvmOptions
            );
          }

          // Write modified Dockerfile to run directory
          const runDockerfilePath = path.join(runDir, 'Dockerfile');
          fs.writeFileSync(runDockerfilePath, modifiedDockerfile);
          this.log(chalk.green(`✓ Dockerfile saved to run directory`));

          // Write application-local.yaml with Virtual Threads configuration
          const appYamlPath = path.join(runDir, 'application-local.yaml');
          const appYaml = this.createApplicationYamlTemplate(config);
          fs.writeFileSync(appYamlPath, appYaml);
          this.log(chalk.green(`✓ application-local.yaml saved to run directory`));
          this.log(chalk.cyan(`  Virtual Threads: ${config.virtualThreadsEnabled ? 'ENABLED' : 'DISABLED'}`));

          // Build and push image for Java versions. GraalVM assumes prebuilt image.
          this.log(chalk.cyan(`   Image tag: ${imageTag}`));
          this.log(chalk.cyan(`   ECR path: ${imageFullPath}`));
          if (answers.javaVersion !== 'GraalVM') {
            this.buildDockerImage(runDockerfilePath, imageTag, imageFullPath, projectRoot);

            // Push to ECR
            this.log(chalk.bold('\n📤 Pushing image to ECR...\n'));
            this.pushImageToECR(imageFullPath);
          } else {
            this.log(chalk.yellow('⚠️  GraalVM selected: skipping image build/push (using prebuilt image)'));
          }

          // Read task definition template and modify it
          this.log(chalk.bold('\n📋 Preparing ECS task definition...\n'));
          const baseTaskDef = this.readTaskDefinitionTemplate(projectRoot);
          const taskDef = this.createTaskDefinition(baseTaskDef, config, imageFullPath);

          // Write task definition to run directory
          const taskDefPath = path.join(runDir, 'task-definition.json');
          fs.writeFileSync(taskDefPath, JSON.stringify(taskDef, null, 2));
          this.log(chalk.green(`✓ Task definition saved to run directory`));

        } catch (error) {
          this.error(chalk.red(`Docker/Task Definition setup failed: ${error.message}`));
        }
      } else if (answers.scenarioType === 'Kafka') {
        this.log(chalk.yellow('\n⚠️  Kafka scenario detected - Docker/Task definition setup skipped'));
      }

      // Write markdown file
      const mdPath = path.join(runDir, 'README.md');
      fs.writeFileSync(mdPath, this.createMarkdownTemplate(config));

      // Print success summary
      this.log(chalk.bold.green('\n╔════════════════════════════════════════════╗'));
      this.log(chalk.bold.green('║         Run Configuration Created!        ║'));
      this.log(chalk.bold.green('╚════════════════════════════════════════════╝\n'));

      this.log(chalk.bold('📁 Run Directory:'));
      this.log(chalk.cyan(`   ${runDir}\n`));

      this.log(chalk.bold('📋 Files Created:'));
      this.log(chalk.cyan('   ✓ run_config.json'));
      this.log(chalk.cyan('   ✓ README.md'));
      if (answers.scenarioType === 'REST') {
        this.log(chalk.cyan('   ✓ Dockerfile'));
        this.log(chalk.cyan('   ✓ application-local.yaml'));
        this.log(chalk.cyan('   ✓ task-definition.json'));
      }
      this.log('');

      this.log(chalk.bold('Configuration Summary:'));
      this.log(`├─ Scenario Type:        ${chalk.cyan(config.scenarioType)}`);
      this.log(`├─ Load Test:            ${chalk.cyan(config.scenario)}`);
      this.log(`├─ Java Version:         ${chalk.cyan(config.javaVersion)}`);
      this.log(`├─ Virtual Threads:      ${config.virtualThreadsEnabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled')}`);
      this.log(`├─ DB Pool Size:         ${chalk.cyan(config.dbPoolSize)}`);
      this.log(`├─ CPU (units):          ${chalk.cyan(config.cpu)}`);
      this.log(`├─ Memory (MB):          ${chalk.cyan(config.memory)}`);
      this.log(`├─ JVM Options:          ${chalk.cyan(config.jvmOptions)}`);
      if (answers.scenarioType === 'REST') {
        this.log(`└─ Docker Image:         ${chalk.cyan(config.dockerImage)}`);
      }
      this.log('');

      this.log(chalk.bold('Next steps:'));
      this.log('1. Run AWS bootstrap: npm run aws-bootstrap');
      this.log('2. Follow the prompts to select this run and configure AWS infrastructure');
      this.log('3. Monitor task deployment in AWS Console (ECS → Clusters)');
      this.log('4. Run the load test against the ALB endpoint');
      this.log('5. Update README.md with test results');
      this.log('');

    } catch (error) {
      this.error(chalk.red(`Error: ${error.message}`));
    }
  }
}

SetupRunCommand.description = 'Interactive CLI to configure benchmark runs';

module.exports = SetupRunCommand;

// Execute if run directly
if (require.main === module) {
  SetupRunCommand.run().catch(require('@oclif/core').handle);
}
