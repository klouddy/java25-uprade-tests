#!/usr/bin/env node

const { ECSClient, DescribeClustersCommand, UpdateClusterSettingsCommand } = require('@aws-sdk/client-ecs');
const { CloudWatchClient, ListMetricsCommand, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

async function main() {
  const region = process.argv[2] || 'us-east-1';
  const clusterName = process.argv[3] || 'java-bench-cluster';
  const serviceName = process.argv[4] || 'java-bench-service';

  console.log(`\n🔍 Diagnosing Container Insights for:`);
  console.log(`   Region: ${region}`);
  console.log(`   Cluster: ${clusterName}`);
  console.log(`   Service: ${serviceName}\n`);

  const ecsClient = new ECSClient({ region });
  const cwClient = new CloudWatchClient({ region });

  // Step 1: Check if Container Insights is enabled
  console.log('1️⃣  Checking Container Insights status...');
  try {
    const response = await ecsClient.send(new DescribeClustersCommand({
      clusters: [clusterName],
      include: ['SETTINGS']
    }));

    const cluster = response.clusters?.[0];
    if (!cluster) {
      console.error(`❌ Cluster '${clusterName}' not found`);
      process.exit(1);
    }

    const insightsSetting = (cluster.settings || []).find(s => s.name === 'containerInsights');
    const enabled = insightsSetting?.value === 'enabled';

    if (enabled) {
      console.log(`✅ Container Insights is ENABLED\n`);
    } else {
      console.log(`⚠️  Container Insights is DISABLED\n`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('Do you want to enable it now? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n⚙️  Enabling Container Insights...');
        await ecsClient.send(new UpdateClusterSettingsCommand({
          cluster: clusterName,
          settings: [{ name: 'containerInsights', value: 'enabled' }]
        }));
        console.log('✅ Container Insights enabled!\n');
        console.log('⏳ Note: Metrics may take 5-15 minutes to start appearing in CloudWatch\n');
      } else {
        console.log('\n❌ Container Insights must be enabled to collect metrics.');
        console.log('   Run the script again with "yes" to enable it.\n');
        process.exit(0);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking cluster: ${error.message}\n`);
    process.exit(1);
  }

  // Step 2: Check available metrics in CloudWatch
  console.log('2️⃣  Checking available CloudWatch metrics...');
  try {
    const response = await cwClient.send(new ListMetricsCommand({
      Namespace: 'ECS/ContainerInsights',
      Dimensions: [
        { Name: 'ClusterName', Value: clusterName },
        { Name: 'ServiceName', Value: serviceName }
      ],
      MaxRecords: 100
    }));

    if (!response.Metrics || response.Metrics.length === 0) {
      console.log(`⚠️  No metrics found for cluster '${clusterName}' and service '${serviceName}'`);
      console.log(`\n   Possible reasons:`);
      console.log(`   • Container Insights was just enabled (wait 5-15 minutes)`);
      console.log(`   • Service hasn't run any tasks yet`);
      console.log(`   • Service/cluster names don't match`);
      console.log(`   • Tasks haven't generated metrics in the time window\n`);
    } else {
      console.log(`✅ Found ${response.Metrics.length} metric(s):\n`);
      const uniqueMetrics = [...new Set(response.Metrics.map(m => m.MetricName))];
      uniqueMetrics.forEach(name => console.log(`   • ${name}`));
      console.log('');

      // Step 3: Try fetching recent data for CpuUtilized
      console.log('3️⃣  Testing data retrieval for CpuUtilized (last 1 hour)...');
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // 1 hour ago

      const statsResponse = await cwClient.send(new GetMetricStatisticsCommand({
        Namespace: 'ECS/ContainerInsights',
        MetricName: 'CpuUtilized',
        Dimensions: [
          { Name: 'ClusterName', Value: clusterName },
          { Name: 'ServiceName', Value: serviceName }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 60,
        Statistics: ['Average']
      }));

      if (!statsResponse.Datapoints || statsResponse.Datapoints.length === 0) {
        console.log(`⚠️  No datapoints in the last hour`);
        console.log(`   This is normal if:`);
        console.log(`   • Tasks haven't been running`);
        console.log(`   • Container Insights was just enabled\n`);
      } else {
        console.log(`✅ Found ${statsResponse.Datapoints.length} datapoint(s) in the last hour`);
        console.log(`   Latest timestamp: ${statsResponse.Datapoints[statsResponse.Datapoints.length - 1].Timestamp}`);
        console.log(`   Average CPU: ${statsResponse.Datapoints[statsResponse.Datapoints.length - 1].Average?.toFixed(2)}\n`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking CloudWatch metrics: ${error.message}\n`);
  }

  console.log('✨ Diagnosis complete!\n');
}

main().catch(error => {
  console.error(`\n❌ Fatal error: ${error.message}\n`);
  process.exit(1);
});
