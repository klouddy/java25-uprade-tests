#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkExampleStack } from "../lib/cdk-example-stack";

const app = new cdk.App();

new CdkExampleStack(app, "CdkExampleStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
