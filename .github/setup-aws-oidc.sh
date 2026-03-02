#!/bin/bash
set -e

# Setup AWS OIDC for GitHub Actions
# This script configures AWS to trust GitHub Actions via OIDC

AWS_ACCOUNT_ID="913846010507"
AWS_REGION="us-east-1"
GITHUB_ORG_OR_USER="klouddy"  # Change this!
GITHUB_REPO="java25-uprade-tests"  # Change this!
ROLE_NAME="GitHubActionsECRRole"

echo "Setting up AWS OIDC for GitHub Actions..."
echo "Account: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "GitHub Repo: $GITHUB_ORG_OR_USER/$GITHUB_REPO"
echo ""

# Step 1: Create OIDC Identity Provider (if not exists)
echo "Step 1: Creating OIDC Identity Provider..."
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com" 2>/dev/null; then
  echo "  ✓ OIDC provider already exists"
else
  aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
    --tags Key=Purpose,Value=GitHubActions
  echo "  ✓ OIDC provider created"
fi

# Step 2: Create IAM Role Trust Policy
echo "Step 2: Creating IAM Role with trust policy..."
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG_OR_USER}/${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --description "Role for GitHub Actions to push to ECR" \
  --tags Key=Purpose,Value=GitHubActions || echo "  ℹ Role may already exist"

echo "  ✓ Role created/updated"

# Step 3: Create and attach ECR permission policy
echo "Step 3: Attaching ECR permissions..."
cat > /tmp/ecr-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:${AWS_REGION}:${AWS_ACCOUNT_ID}:repository/benchmark-app"
    }
  ]
}
EOF

# Create inline policy
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "ECRPushPolicy" \
  --policy-document file:///tmp/ecr-policy.json

echo "  ✓ ECR permissions attached"

# Cleanup temp files
rm /tmp/trust-policy.json /tmp/ecr-policy.json

# Step 4: Display GitHub Secrets to configure
echo ""
echo "================================================================"
echo "✓ AWS OIDC setup complete!"
echo "================================================================"
echo ""
echo "Now configure these GitHub Repository Secrets:"
echo "  Repository → Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "  AWS_REGION: $AWS_REGION"
echo "  AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
echo ""
echo "No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY needed! 🎉"
echo ""
echo "Role ARN: arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"
echo ""
echo "You can now run the GitHub Actions workflow."
echo "================================================================"
