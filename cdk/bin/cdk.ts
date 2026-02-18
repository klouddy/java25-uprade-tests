#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BenchmarkInfraStack } from '../lib/benchmark-infra-stack';

const app = new cdk.App();

// Get configuration from context
const javaVersion = app.node.tryGetContext('javaVersion') || '17';
const containerImage = app.node.tryGetContext('containerImage') || 'public.ecr.aws/amazonlinux/amazonlinux:2023';
const cpu = Number(app.node.tryGetContext('cpu')) || 512;
const memoryLimitMiB = Number(app.node.tryGetContext('memoryLimitMiB')) || 1024;
const desiredCount = Number(app.node.tryGetContext('desiredCount')) || 1;
const dbEngine = app.node.tryGetContext('dbEngine') || 'postgres';
const dbInstanceClass = app.node.tryGetContext('dbInstanceClass') || 'db.t4g.micro';

new BenchmarkInfraStack(app, 'BenchmarkInfraStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
  description: 'Benchmark infrastructure for Java 17/21/25 performance testing on ECS Fargate with RDS',
  javaVersion,
  containerImage,
  cpu,
  memoryLimitMiB,
  desiredCount,
  dbEngine,
  dbInstanceClass,
});

// Add tags to all resources in the app
cdk.Tags.of(app).add('Project', 'java-benchmark');
cdk.Tags.of(app).add('JavaVersion', javaVersion);
cdk.Tags.of(app).add('Environment', 'benchmark');
