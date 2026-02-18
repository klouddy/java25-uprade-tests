import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { BenchmarkInfraStack } from '../lib/benchmark-infra-stack';

describe('BenchmarkInfraStack', () => {
  test('Creates VPC', () => {
    const app = new cdk.App();
    const stack = new BenchmarkInfraStack(app, 'TestStack', {
      javaVersion: '17',
      containerImage: 'test-image:latest',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      dbEngine: 'postgres',
      dbInstanceClass: 'db.t4g.micro',
    });
    
    const template = Template.fromStack(stack);
    
    // Verify VPC is created
    template.hasResourceProperties('AWS::EC2::VPC', {});
  });

  test('Creates ECS Cluster', () => {
    const app = new cdk.App();
    const stack = new BenchmarkInfraStack(app, 'TestStack', {
      javaVersion: '17',
      containerImage: 'test-image:latest',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      dbEngine: 'postgres',
      dbInstanceClass: 'db.t4g.micro',
    });
    
    const template = Template.fromStack(stack);
    
    // Verify ECS Cluster is created
    template.hasResourceProperties('AWS::ECS::Cluster', {});
  });

  test('Creates Application Load Balancer', () => {
    const app = new cdk.App();
    const stack = new BenchmarkInfraStack(app, 'TestStack', {
      javaVersion: '17',
      containerImage: 'test-image:latest',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      dbEngine: 'postgres',
      dbInstanceClass: 'db.t4g.micro',
    });
    
    const template = Template.fromStack(stack);
    
    // Verify ALB is created
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
    });
  });

  test('Creates RDS Database', () => {
    const app = new cdk.App();
    const stack = new BenchmarkInfraStack(app, 'TestStack', {
      javaVersion: '17',
      containerImage: 'test-image:latest',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      dbEngine: 'postgres',
      dbInstanceClass: 'db.t4g.micro',
    });
    
    const template = Template.fromStack(stack);
    
    // Verify RDS Instance is created
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.t4g.micro',
      Engine: 'postgres',
    });
  });

  test('Creates Secrets Manager Secret', () => {
    const app = new cdk.App();
    const stack = new BenchmarkInfraStack(app, 'TestStack', {
      javaVersion: '17',
      containerImage: 'test-image:latest',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      dbEngine: 'postgres',
      dbInstanceClass: 'db.t4g.micro',
    });
    
    const template = Template.fromStack(stack);
    
    // Verify Secrets Manager Secret is created
    template.hasResourceProperties('AWS::SecretsManager::Secret', {});
  });

  test('Outputs ALB URL', () => {
    const app = new cdk.App();
    const stack = new BenchmarkInfraStack(app, 'TestStack', {
      javaVersion: '17',
      containerImage: 'test-image:latest',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      dbEngine: 'postgres',
      dbInstanceClass: 'db.t4g.micro',
    });
    
    const template = Template.fromStack(stack);
    
    // Verify CloudFormation outputs exist
    template.hasOutput('AlbUrl', {});
    template.hasOutput('DatabaseEndpoint', {});
  });
});

