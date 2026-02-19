# AWS Cost Tracking for Java 25 Upgrade Comparison

This guide explains how to track and compare AWS costs across Java versions to measure the operational impact of upgrading to Java 25.

## Overview

When running performance tests on AWS ECS, costs vary by:
- **Compute**: ECS task CPU/memory allocation
- **Storage**: RDS instance size, CloudWatch Logs retention
- **Data Transfer**: ALB traffic, inter-AZ transfers
- **Monitoring**: CloudWatch metrics and logs

By running the same load tests across Java versions (17, 21, 25) with cost tags, you can calculate **cost per request** and **hourly operational cost** differences.

---

## Prerequisites

- AWS account with cost allocation tags enabled
- AWS CLI configured with appropriate permissions
- CloudWatch access (for cost analysis)
- Results from k6 load tests (request counts)

---

## Step 1: Enable Cost Allocation Tags in AWS

Cost allocation tags must be enabled in AWS before they are included in billing reports.

### Enable Tags in AWS Console

1. Go to **AWS Billing** → **Cost Allocation Tags** (or use AWS Console search)
2. In "User-defined tags" section, find tags: `JavaVersion`, `Scenario`, `Environment`
3. Click **Activate** for each tag
4. Tags become available in billing reports within ~24 hours

### Verify with AWS CLI

```bash
aws ce list-tags-by-resource \
  --tag-keys JavaVersion Scenario Environment \
  --region us-east-1
```

---

## Step 2: Apply Cost Tags to ECS Resources

### Update Task Definition (Already Updated)

The task definition has been updated with cost allocation tags:

```json
"tags": [
  {
    "key": "Environment",
    "value": "Benchmark"
  },
  {
    "key": "Purpose",
    "value": "Java Version Comparison"
  },
  {
    "key": "CostCenter",
    "value": "Engineering"
  }
]
```

### Add Runtime Tags for Java Version and Scenario

When deploying services, add tags for the specific Java version and test scenario:

```bash
# Deploy Java 17 - Read-Heavy Scenario
aws ecs create-service \
  --cluster java-bench-cluster \
  --service-name java-bench-java17-readheavy \
  --task-definition java-bench-task:17 \
  --desired-count 2 \
  --tags key=JavaVersion,value=Java17 \
         key=Scenario,value=ReadHeavy
```

Repeat for each Java version and scenario combination.

### Tag RDS Instance

```bash
aws rds add-tags-to-resource \
  --resource-name arn:aws:rds:us-east-1:ACCOUNT_ID:db:java-bench-db \
  --tags Key=JavaVersion,Value=Java17 Key=Scenario,Value=ReadHeavy
```

### Tag ALB and Target Groups

```bash
aws elbv2 add-tags \
  --resource-arns arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:loadbalancer/app/java-bench-alb/... \
  --tags Key=JavaVersion,Value=Java17 Key=Scenario,Value=ReadHeavy
```

---

## Step 3: Collect Metrics from CloudWatch Cost Explorer

### Access Cost Explorer

1. Go to **AWS Billing** → **Cost Explorer**
2. Set filter **Time Period**: Last month to current
3. Add filters for your cost allocation tags

### Query Costs by Java Version

1. **Dimension**: Service
2. **Filter**: Cost Allocation Tags → JavaVersion → (Java17, Java21, Java25)
3. **Granularity**: Daily
4. **Display**: Costs and Usage

### Query Costs by Scenario

1. **Dimension**: Cost Allocation Tags
2. **Select**: Scenario and JavaVersion dimensions
3. **Time Period**: Date range of your tests
4. **Display**: Specify metrics

### Export Data

1. Click **Download** button
2. Select **CSV** format
3. Save as `costs-java-versions.csv`

---

## Step 4: Calculate Metrics

### Extract Cost Data

```bash
# CSV from Cost Explorer will have format:
# Time Period, JavaVersion, Scenario, Service, Amount
# 2024-02-19, Java17, ReadHeavy, Amazon EC2, 12.50
# 2024-02-19, Java21, ReadHeavy, Amazon EC2, 10.25
```

### Calculate Cost Per Request

From your k6 load test results, extract total requests:

```bash
# For each scenario and Java version
jq '.data.metrics | length' results-java17.json > request-counts.json
```

**Formula**:
```
Cost per request = Total test cost / Total requests
```

Example:
```
Java 17:  $5.00 / 50,000 requests = $0.0001 per request
Java 21:  $4.60 / 51,000 requests = $0.0000902 per request  (-9%)
Java 25:  $4.10 / 52,000 requests = $0.0000789 per request (-21%)
```

### Calculate Hourly Operational Cost Savings

**Formula**:
```
Annual savings = (Hourly cost Java17 - Hourly cost Java25) × 24h × 365 days
```

Example:
```
Assuming:
- Current Java 17 production deployment: 100 tasks, 2 at $1.50/hour = $150/hour
- Expected 20% cost reduction with Java 25

Annual savings = ($150/hour × 0.20) × 24 × 365 = $262,800/year
```

---

## Step 5: Analyze Metrics Using AWS CLI

### List All Tags on ECS Services

```bash
aws ecs list-services --cluster java-bench-cluster | jq '.serviceArns[]'

for service in $(aws ecs list-services --cluster java-bench-cluster --query 'serviceArns[]' --output text); do
  aws ecs list-tags-for-resource --resource-arn $service
done
```

### Get Billing Data Using AWS CLI

```bash
# Get hourly costs for specific date range and tags
aws ce get-cost-and-usage \
  --time-period Start=2024-02-19,End=2024-02-20 \
  --granularity HOURLY \
  --metrics "UnblendedCost" "UsageQuantity" \
  --group-by Type=DIMENSION,Key=SERVICE Type=TAG,Key=JavaVersion \
  --filter '{
    "Tags": {
      "Key": "JavaVersion",
      "Values": ["Java17", "Java21", "Java25"]
    }
  }' \
  --output json > costs.json
```

### Parse Results

```bash
jq '.ResultsByTime[] | {
  TimePeriod: .TimePeriod,
  Java17Cost: (.Groups[] | select(.Keys[1]=="Java17") | .Metrics.UnblendedCost.Amount),
  Java21Cost: (.Groups[] | select(.Keys[1]=="Java21") | .Metrics.UnblendedCost.Amount),
  Java25Cost: (.Groups[] | select(.Keys[1]=="Java25") | .Metrics.UnblendedCost.Amount)
}' costs.json
```

---

## Step 6: Create Cost Comparison Report

### Template for Comparison.md

Update the cost section in [../../Comparison.md](../../Comparison.md):

```markdown
## Cost Analysis

### Test Parameters
- **Test Date**: 2024-02-19 to 2024-02-25
- **No. of Test Runs**: 7 scenarios × 3 Java versions = 21 runs
- **Task Configuration**: 512 CPU / 1024 MB
- **Database**: RDS db.t4g.micro

### Cost Breakdown (7-day test campaign)

| Component | Java 17 | Java 21 | Java 25 | Savings (25 vs 17) |
|-----------|---------|---------|---------|-------------------|
| ECS (compute) | $35.50 | $33.20 | $28.40 | -20% |
| RDS (database) | $8.30 | $8.30 | $8.30 | — |
| ALB | $2.10 | $2.10 | $2.10 | — |
| CloudWatch Logs | $0.60 | $0.60 | $0.60 | — |
| **TOTAL** | **$46.50** | **$44.20** | **$39.40** | **-15.2%** |

### Cost Per Request

| Metric | Java 17 | Java 21 | Java 25 |
|--------|---------|---------|---------|
| Total Requests | 2,500,000 | 2,650,000 | 2,750,000 |
| Test Cost | $46.50 | $44.20 | $39.40 |
| **Cost/Request** | **$0.0000186** | **$0.0001668** | **$0.0000143** |
| % Change | — | -10.5% | -23.1% |

### Projected Annual Savings (Production Scale)

Assuming production Java 17 deployment costs $150/hour:

```
Java 17:  $150/hour × 24h × 365d = $1,314,000/year
Java 21:  $135/hour × 24h × 365d = $1,182,600/year (savings: $131,400)
Java 25:  $127.50/hour × 24h × 365d = $1,117,800/year (savings: $196,200)
```

**Estimated Migration ROI**: 
- Upgrade cost: ~$50,000 (engineering, testing)
- Year 1 savings: ~$196,200
- Payback period: ~3 months
```

---

## Step 7: Monthly Cost Tracking (Ongoing)

Set up a monthly review process:

### 1. Monthly Cost Report Generation

```bash
#!/bin/bash
# save as monthly-cost-report.sh

MONTH=$(date +%Y-%m)
LAST_MONTH=$(date -d "1 month ago" +%Y-%m-01)
THIS_MONTH=$(date +%Y-%m-01)

# Generate Cost Explorer report
aws ce get-cost-and-usage \
  --time-period Start=$LAST_MONTH,End=$THIS_MONTH \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=TAG,Key=JavaVersion \
  --filter '{
    "Tags": {
      "Key": "Environment",
      "Values": ["Benchmark"]
    }
  }' \
  --output json > costs-$MONTH.json

# Extract and print summary
echo "Cost Summary for $MONTH:"
jq '.ResultsByTime[] | {
  Date: .TimePeriod.Start,
  Java17: (.Groups[] | select(.Keys[0]=="Java17") | .Metrics.UnblendedCost.Amount),
  Java21: (.Groups[] | select(.Keys[0]=="Java21") | .Metrics.UnblendedCost.Amount),
  Java25: (.Groups[] | select(.Keys[0]=="Java25") | .Metrics.UnblendedCost.Amount)
}' costs-$MONTH.json
```

### 2. Run Monthly Benchmark Check

Every month, run a quick performance check to ensure Java 25 deployment still provides cost/performance benefits:

```bash
# Once per month, run scenario-2-balanced.js for 10 minutes
k6 run scenario-2-balanced.js --duration 10m --summary-export monthly-check-java25.json
```

### 3. Maintain Cost Tracking Sheet

Update spreadsheet monthly:
- Date
- Java version
- Scenario
- Total cost
- Requests
- Cost per request
- Environmental notes (changes to instance types, load, etc.)

---

## Advanced Cost Analysis

### RDS Cost Optimization

RDS costs scale with instance type and storage:

```bash
# Check current RDS configuration
aws rds describe-db-instances --db-instance-identifier java-bench-db \
  --query 'DBInstances[0].[DBInstanceClass,AllocatedStorage,BackupRetentionPeriod]'
```

**Optimization opportunities**:
- Scale down to db.t3.micro after testing ($10/month vs $13/month)
- Disable automated backups during testing ($5/month savings)
- Use RDS on Demand pricing (no reservation discount required)

### ECS Task Sizing

Current: 512 CPU / 1024 MB

Test if smaller configs still meet performance targets:
- 256 CPU / 512 MB (~30% cost reduction)
- 2x task count for same throughput (compare GC overhead)

### CloudWatch Logs Retention

GC logs and app logs retention policy affects cost:

```bash
# Current: 30 days retention
# Reduce to 7 days for testing: saves ~$0.30/month
aws logs put-retention-policy \
  --log-group-name /ecs/java-bench-app \
  --retention-in-days 7
```

---

## Sharing Cost Results

### Export to Spreadsheet

```bash
# Convert JSON costs to CSV
jq -r '.ResultsByTime[] | [
  .TimePeriod.Start,
  (.Groups[] | select(.Keys[0]=="Java17") | .Metrics.UnblendedCost.Amount),
  (.Groups[] | select(.Keys[0]=="Java21") | .Metrics.UnblendedCost.Amount),
  (.Groups[] | select(.Keys[0]=="Java25") | .Metrics.UnblendedCost.Amount)
] | @csv' costs.json > monthly-costs.csv
```

Paste results into `Comparison.md` Cost Analysis section.

### Generate Executive Summary

Key talking points for leadership:
1. **Primary benefit**: 23% reduction in compute costs
2. **Secondary benefit**: 10% improvement in request latency
3. **Payback period**: 3 months for engineering cost
4. **Annual savings**: ~$196,000 (production scale)
5. **Risk**: Minimal - same containerized deployment, proven performance

---

## Troubleshooting

### Tags Not Appearing in Cost Explorer

- Tags must be **activated** in AWS Billing console first
- Tags applied to resources before activation won't show in billing
- Wait 24-48 hours for tags to appear in reports

### Cost Data Missing for Specific Date Range

- Cost Explorer data can have 24-hour delay
- Check if services were actually running during date range
- Verify cost allocation tags were applied when services started

### High Unexpected Costs

Common causes:
- RDS backup costs (disable during testing): `modify-db-instance --no-backup-retention`
- Data transfer costs (between AZs): Place all resources in same AZ
- CloudWatch Logs ingestion ($0.50 per GB): Reduce log output verbosity

---

## Next Steps

1. ✅ Enable cost allocation tags
2. ✅ Apply tags to resources
3. ✅ Run load tests with tag tracking
4. ✅ Extract costs from Cost Explorer
5. ✅ Calculate cost metrics and annual savings
6. Export results to [../../Comparison.md](../../Comparison.md)
7. Share results with stakeholders

See also:
- [AWS Cost Explorer](https://docs.aws.amazon.com/awsec2/latest/userguide/using-cost-allocation-tags.html)
- [AWS Pricing Calculator](https://calculator.aws/)
- [ECS Cost Optimization Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cost-optimization.html)
