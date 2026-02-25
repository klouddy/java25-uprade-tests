# CDK Example (TypeScript)

Hello-world AWS CDK v2 app that creates a single S3 bucket.

## Quick start

```bash
cd cdk-example
npm install

# Synthesize the CloudFormation template
npx cdk synth
```

## Deploy

```bash
npx cdk deploy
```

## Destroy

```bash
npx cdk destroy
```

Notes:
- The bucket is configured with `RemovalPolicy.DESTROY` and `autoDeleteObjects: true` for easy cleanup in a demo.
- Uses the default account/region from your AWS credentials.
