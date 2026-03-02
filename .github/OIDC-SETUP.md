# GitHub Actions AWS OIDC Setup

This guide explains how to set up OpenID Connect (OIDC) authentication between GitHub Actions and AWS. This is the **most secure approach** - no long-lived credentials are stored in GitHub.

## Why OIDC?

✅ **No stored credentials** - GitHub assumes an IAM role via federated identity  
✅ **Automatic credential rotation** - Temporary credentials per workflow run  
✅ **Fine-grained access control** - Restrict by repository, branch, or environment  
✅ **No expiration issues** - Unlike session tokens that expire in hours  

## Prerequisites

- AWS CLI configured with admin access
- Your GitHub repository name (e.g., `username/java25-upgrade-tests`)
- Your AWS Account ID: `913846010507`

## Setup Steps

### 1. Edit the setup script

Update these values in `.github/setup-aws-oidc.sh`:

```bash
GITHUB_ORG_OR_USER="<YOUR_GITHUB_USERNAME_OR_ORG>"  # e.g., "jromero" or "your-org"
GITHUB_REPO="<YOUR_REPO_NAME>"                      # e.g., "java25-upgrade-tests"
```

### 2. Run the setup script

```bash
cd .github
./setup-aws-oidc.sh
```

The script will:
1. Create AWS OIDC identity provider for GitHub (if not exists)
2. Create IAM role `GitHubActionsECRRole` with trust policy
3. Attach ECR push permissions to the role
4. Display the GitHub secrets you need to configure

### 3. Configure GitHub Secrets

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these **2 secrets**:

| Name | Value |
|------|-------|
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | `913846010507` |

**That's it!** No `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or `AWS_SESSION_TOKEN` needed.

### 4. Test the workflow

Go to **Actions → Build GraalVM Native Image → Run workflow**

The workflow will:
1. Request temporary credentials from AWS STS
2. Assume the `GitHubActionsECRRole` 
3. Build and push the GraalVM image to ECR

## How It Works

```
GitHub Actions Workflow
         ↓  (requests identity token)
GitHub OIDC Provider
         ↓  (token contains repo/branch/commit metadata)
AWS STS AssumeRoleWithWebIdentity
         ↓  (validates trust policy)
IAM Role: GitHubActionsECRRole
         ↓  (temporary credentials valid ~1 hour)
Amazon ECR
```

The trust policy ensures only workflows from **your specific repository** can assume the role.

## Troubleshooting

### Error: "No OpenIDConnect provider found"
Run the setup script again - the OIDC provider wasn't created.

### Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"
Check the trust policy includes your correct repository path:
```bash
aws iam get-role --role-name GitHubActionsECRRole
```

### Error: "Access Denied" when pushing to ECR
Verify ECR permissions on the role:
```bash
aws iam get-role-policy --role-name GitHubActionsECRRole --policy-name ECRPushPolicy
```

## Manual Setup (Alternative)

If you prefer to run commands manually instead of using the script:

<details>
<summary>Click to expand manual commands</summary>

### Create OIDC Provider
```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

### Create Trust Policy
```bash
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::913846010507:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
EOF
```

### Create Role
```bash
aws iam create-role \
  --role-name GitHubActionsECRRole \
  --assume-role-policy-document file://trust-policy.json
```

### Attach ECR Permissions
```bash
cat > ecr-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:913846010507:repository/benchmark-app"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name GitHubActionsECRRole \
  --policy-name ECRPushPolicy \
  --policy-document file://ecr-policy.json
```

</details>

## Security Best Practices

✅ The trust policy restricts access to **your specific repository**  
✅ Credentials are temporary (~1 hour) and auto-expire  
✅ Each workflow run gets unique credentials  
✅ No credentials stored in GitHub - only metadata  
✅ Can further restrict by branch: `"token.actions.githubusercontent.com:sub": "repo:org/repo:ref:refs/heads/main"`  

## References

- [AWS OIDC with GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
