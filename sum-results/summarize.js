#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { ECSClient, DescribeServicesCommand, DescribeTaskDefinitionCommand } = require('@aws-sdk/client-ecs');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function parseNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/,/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function summarizeValues(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, v) => sum + v, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: total / values.length,
    count: values.length
  };
}

function summarizeDatapoints(datapoints, valueKey) {
  const values = datapoints
    .map((point) => parseNumber(point[valueKey]))
    .filter((value) => value != null);
  const summary = summarizeValues(values);

  return {
    summary,
    datapoints: datapoints
      .map((point) => ({
        timestamp: point.Timestamp,
        value: point[valueKey],
        unit: point.Unit || null
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  };
}

function parseK6Summary(text) {
  const result = {};

  const durationMatch = text.match(/TEST DURATION:\s+([0-9.]+) seconds/);
  if (durationMatch) {
    result.durationSeconds = parseNumber(durationMatch[1]);
  }

  const httpReqsMatch = text.match(/http_reqs\.+:\s+([0-9]+)\s+([0-9.]+)\/s/);
  if (httpReqsMatch) {
    result.totalRequests = parseNumber(httpReqsMatch[1]);
    result.throughputRps = parseNumber(httpReqsMatch[2]);
  }

  const httpFailedMatch = text.match(/http_req_failed\.+:\s+([0-9.]+)%\s+([0-9]+) out of ([0-9]+)/);
  if (httpFailedMatch) {
    result.errorRatePercent = parseNumber(httpFailedMatch[1]);
    result.errorCount = parseNumber(httpFailedMatch[2]);
    result.errorCountTotal = parseNumber(httpFailedMatch[3]);
  }

  const durationLine = text.match(/http_req_duration\.+:\s+avg=([0-9.]+)ms\s+min=([0-9.]+)ms\s+med=([0-9.]+)ms\s+max=([0-9.]+)s\s+p\(90\)=([0-9.]+)ms\s+p\(95\)=([0-9.]+)ms/);
  if (durationLine) {
    result.latency = {
      avgMs: parseNumber(durationLine[1]),
      minMs: parseNumber(durationLine[2]),
      p50Ms: parseNumber(durationLine[3]),
      maxSeconds: parseNumber(durationLine[4]),
      p90Ms: parseNumber(durationLine[5]),
      p95Ms: parseNumber(durationLine[6])
    };
  }

  const p99Match = text.match(/p\(99\)=([0-9.]+)ms/);
  if (p99Match) {
    result.latency = result.latency || {};
    result.latency.p99Ms = parseNumber(p99Match[1]);
  }

  return result;
}

function parseContainerStats(text) {
  const sections = {};
  let current = null;
  let mode = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('== ')) {
      current = line.replace(/=+/g, '').trim();
      mode = null;
      sections[current] = sections[current] || {};
      continue;
    }

    if (line.includes('Average') && line.includes('Timestamp')) {
      mode = 'average';
      sections[current][mode] = sections[current][mode] || [];
      continue;
    }

    if (line.includes('Maximum') && line.includes('Timestamp')) {
      mode = 'maximum';
      sections[current][mode] = sections[current][mode] || [];
      continue;
    }

    if (!current || !mode) continue;

    const match = line.match(/\|\|\s*([-0-9.]+)\s*\|/);
    if (match) {
      const value = parseNumber(match[1]);
      if (value != null) {
        sections[current][mode].push(value);
      }
    }
  }

  const summary = {};
  for (const [section, modes] of Object.entries(sections)) {
    summary[section] = {};
    for (const [modeName, values] of Object.entries(modes)) {
      summary[section][modeName] = summarizeValues(values);
    }
  }

  return summary;
}

function parsePromStats(json) {
  const metrics = {};
  const labels = {};

  for (const [metricName, seriesList] of Object.entries(json.metrics || {})) {
    const values = [];
    let sampleLabels = null;

    for (const series of seriesList || []) {
      if (!sampleLabels && series.metric) {
        sampleLabels = series.metric;
      }
      for (const pair of series.values || []) {
        const value = parseNumber(pair[1]);
        if (value != null) values.push(value);
      }
    }

    metrics[metricName] = {
      summary: summarizeValues(values),
      seriesCount: (seriesList || []).length
    };

    if (sampleLabels) {
      labels[metricName] = {
        app_image: sampleLabels.app_image || null,
        java_version: sampleLabels.java_version || null,
        job: sampleLabels.job || null,
        instance: sampleLabels.instance || null
      };
    }
  }

  return { metrics, labels };
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchPrometheusMetrics(promConfig, runConfig) {
  if (!promConfig || !runConfig.albUrl) {
    return null;
  }

  const promUrl = `${runConfig.albUrl}/prometheus`;
  const { startTime, endTime } = runConfig;
  const step = promConfig.step || '60s';

  const queries = {
    'heap-used-bytes': 'jvm_memory_used_bytes{area="heap"}',
    'non-heap-used-bytes': 'jvm_memory_used_bytes{area="nonheap"}',
    'gc-pause-rate-5m': 'rate(jvm_gc_pause_seconds_sum[5m])',
    'gc-pause-max': 'jvm_gc_pause_seconds_max',
    'live-threads': 'jvm_threads_live',
    'process-cpu-usage': 'process_cpu_usage',
    'system-cpu-usage': 'system_cpu_usage',
    'heap-committed-bytes': 'jvm_memory_committed_bytes{area="heap"}',
    'classes-loaded': 'jvm_classes_loaded',
    'gc-count-rate-5m': 'rate(jvm_gc_pause_seconds_count[5m])'
  };

  const metrics = {};

  for (const [metricName, query] of Object.entries(queries)) {
    try {
      const url = `${promUrl}/api/v1/query_range?` + 
        `query=${encodeURIComponent(query)}&` +
        `start=${encodeURIComponent(startTime)}&` +
        `end=${encodeURIComponent(endTime)}&` +
        `step=${encodeURIComponent(step)}`;
      
      const response = await httpGet(url);
      const data = JSON.parse(response);
      
      if (data.status === 'success' && data.data && data.data.result) {
        metrics[metricName] = data.data.result;
      } else {
        metrics[metricName] = [];
      }
    } catch (error) {
      console.error(`Error fetching Prometheus metric ${metricName}: ${error.message}`);
      metrics[metricName] = [];
    }
  }

  return {
    metadata: {
      promUrl,
      startTime,
      endTime,
      step,
      generatedAt: new Date().toISOString()
    },
    metrics
  };
}

async function fetchEcsInfo(ecsConfig) {
  if (!ecsConfig || !ecsConfig.clusterName || !ecsConfig.serviceName || !ecsConfig.region) {
    return null;
  }

  const client = new ECSClient({ region: ecsConfig.region });

  const serviceResponse = await client.send(new DescribeServicesCommand({
    cluster: ecsConfig.clusterName,
    services: [ecsConfig.serviceName]
  }));

  const service = (serviceResponse.services || [])[0];
  if (!service) {
    throw new Error(`ECS service not found: ${ecsConfig.serviceName}`);
  }

  const taskDefArn = service.taskDefinition;
  const taskDefResponse = await client.send(new DescribeTaskDefinitionCommand({
    taskDefinition: taskDefArn
  }));

  const taskDef = taskDefResponse.taskDefinition || {};
  const containers = (taskDef.containerDefinitions || []).map((container) => ({
    name: container.name,
    image: container.image,
    cpu: container.cpu ?? null,
    memory: container.memory ?? null,
    memoryReservation: container.memoryReservation ?? null,
    portMappings: container.portMappings || [],
    logConfiguration: container.logConfiguration || null,
    healthCheck: container.healthCheck || null,
    environment: container.environment || []
  }));

  return {
    clusterName: ecsConfig.clusterName,
    serviceName: ecsConfig.serviceName,
    desiredCount: service.desiredCount ?? null,
    runningCount: service.runningCount ?? null,
    taskDefinitionArn: taskDefArn,
    taskCpu: taskDef.cpu ?? null,
    taskMemory: taskDef.memory ?? null,
    containers
  };
}

async function fetchRdsInfo(rdsConfig) {
  if (!rdsConfig || !rdsConfig.instanceId || !rdsConfig.region) {
    return null;
  }

  const client = new RDSClient({ region: rdsConfig.region });

  const response = await client.send(new DescribeDBInstancesCommand({
    DBInstanceIdentifier: rdsConfig.instanceId
  }));

  const instance = (response.DBInstances || [])[0];
  if (!instance) {
    throw new Error(`RDS instance not found: ${rdsConfig.instanceId}`);
  }

  return {
    instanceId: instance.DBInstanceIdentifier,
    instanceClass: instance.DBInstanceClass,
    engine: instance.Engine,
    engineVersion: instance.EngineVersion,
    allocatedStorage: instance.AllocatedStorage,
    status: instance.DBInstanceStatus,
    masterUsername: instance.MasterUsername,
    databaseName: instance.DBName,
    port: instance.Endpoint?.Port ?? null,
    multiAZ: instance.MultiAZ ?? false,
    backupRetentionPeriod: instance.BackupRetentionPeriod ?? null,
    preferredBackupWindow: instance.PreferredBackupWindow ?? null,
    preferredMaintenanceWindow: instance.PreferredMaintenanceWindow ?? null,
    maxAllocatedStorage: instance.MaxAllocatedStorage ?? null
  };
}

async function fetchRdsMetrics(rdsConfig, runConfig) {
  if (!rdsConfig || !rdsConfig.instanceId || !rdsConfig.region) {
    return null;
  }
  if (!runConfig || !runConfig.startTime || !runConfig.endTime) {
    return null;
  }

  const client = new CloudWatchClient({ region: rdsConfig.region });
  const startTime = new Date(runConfig.startTime);
  const endTime = new Date(runConfig.endTime);
  const period = rdsConfig.metricsPeriodSeconds || 60;

  async function getStats(metricName, stats) {
    const response = await client.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/RDS',
      MetricName: metricName,
      Dimensions: [
        { Name: 'DBInstanceIdentifier', Value: rdsConfig.instanceId }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: period,
      Statistics: stats
    }));
    return response.Datapoints || [];
  }

  const cpuAverage = await getStats('CPUUtilization', ['Average']);
  const cpuMaximum = await getStats('CPUUtilization', ['Maximum']);
  const connAverage = await getStats('DatabaseConnections', ['Average']);
  const connMaximum = await getStats('DatabaseConnections', ['Maximum']);
  const readLatAverage = await getStats('ReadLatency', ['Average']);
  const readLatMaximum = await getStats('ReadLatency', ['Maximum']);
  const writeLatAverage = await getStats('WriteLatency', ['Average']);
  const writeLatMaximum = await getStats('WriteLatency', ['Maximum']);
  const readThrAverage = await getStats('ReadThroughput', ['Average']);
  const writeThrAverage = await getStats('WriteThroughput', ['Average']);
  const readOpsAverage = await getStats('ReadIOPS', ['Average']);
  const writeOpsAverage = await getStats('WriteIOPS', ['Average']);

  return {
    periodSeconds: period,
    CPUUtilization: {
      Average: summarizeDatapoints(cpuAverage, 'Average'),
      Maximum: summarizeDatapoints(cpuMaximum, 'Maximum')
    },
    DatabaseConnections: {
      Average: summarizeDatapoints(connAverage, 'Value'),
      Maximum: summarizeDatapoints(connMaximum, 'Value')
    },
    ReadLatency: {
      Average: summarizeDatapoints(readLatAverage, 'Average'),
      Maximum: summarizeDatapoints(readLatMaximum, 'Maximum')
    },
    WriteLatency: {
      Average: summarizeDatapoints(writeLatAverage, 'Average'),
      Maximum: summarizeDatapoints(writeLatMaximum, 'Maximum')
    },
    ReadThroughput: {
      Average: summarizeDatapoints(readThrAverage, 'Average')
    },
    WriteThroughput: {
      Average: summarizeDatapoints(writeThrAverage, 'Average')
    },
    ReadIOPS: {
      Average: summarizeDatapoints(readOpsAverage, 'Average')
    },
    WriteIOPS: {
      Average: summarizeDatapoints(writeOpsAverage, 'Average')
    }
  };
}

async function fetchContainerMetrics(ecsConfig, runConfig) {
  if (!ecsConfig || !ecsConfig.clusterName || !ecsConfig.serviceName || !ecsConfig.region) {
    return null;
  }
  if (!runConfig || !runConfig.startTime || !runConfig.endTime) {
    return null;
  }

  const client = new CloudWatchClient({ region: ecsConfig.region });
  const startTime = new Date(runConfig.startTime);
  const endTime = new Date(runConfig.endTime);
  const period = ecsConfig.metricsPeriodSeconds || 60;

  async function getStats(metricName, stats) {
    const response = await client.send(new GetMetricStatisticsCommand({
      Namespace: 'ECS/ContainerInsights',
      MetricName: metricName,
      Dimensions: [
        { Name: 'ClusterName', Value: ecsConfig.clusterName },
        { Name: 'ServiceName', Value: ecsConfig.serviceName }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: period,
      Statistics: stats
    }));
    return response.Datapoints || [];
  }

  const cpuAverage = await getStats('CpuUtilized', ['Average']);
  const cpuMaximum = await getStats('CpuUtilized', ['Maximum']);
  const memAverage = await getStats('MemoryUtilized', ['Average']);
  const memMaximum = await getStats('MemoryUtilized', ['Maximum']);
  const rxSum = await getStats('NetworkRxBytes', ['Sum']);
  const txSum = await getStats('NetworkTxBytes', ['Sum']);

  return {
    periodSeconds: period,
    CpuUtilized: {
      Average: summarizeDatapoints(cpuAverage, 'Average'),
      Maximum: summarizeDatapoints(cpuMaximum, 'Maximum')
    },
    MemoryUtilized: {
      Average: summarizeDatapoints(memAverage, 'Average'),
      Maximum: summarizeDatapoints(memMaximum, 'Maximum')
    },
    NetworkRxBytes: {
      Sum: summarizeDatapoints(rxSum, 'Sum')
    },
    NetworkTxBytes: {
      Sum: summarizeDatapoints(txSum, 'Sum')
    }
  };
}

function formatMarkdown(summary) {
  const lines = [];

  lines.push(`# Java ${summary.run.javaVersion} Scenario ${summary.run.scenario} Summary`);
  lines.push('');
  lines.push(`- **Start Time**: ${summary.run.startTime}`);
  lines.push(`- **End Time**: ${summary.run.endTime}`);
  lines.push(`- **ALB URL**: ${summary.run.albUrl}`);
  if (summary.run.container) {
    lines.push(`- **Task CPU**: ${summary.run.container.cpuUnits} units`);
    lines.push(`- **Task Memory**: ${summary.run.container.memoryMb} MB`);
  } else if (summary.ecs && !summary.ecs.error) {
    lines.push(`- **Task CPU**: ${summary.ecs.taskCpu ?? 'n/a'}`);
    lines.push(`- **Task Memory**: ${summary.ecs.taskMemory ?? 'n/a'}`);
  }
  lines.push(`- **JVM Settings**: ${summary.run.jvm.settings}`);
  lines.push('');

  const k6 = summary.k6;
  lines.push('## K6 Load Results');
  lines.push('');
  lines.push(`- **Requests**: ${k6.totalRequests}`);
  lines.push(`- **Throughput (RPS)**: ${k6.throughputRps}`);
  lines.push(`- **Error Rate (%)**: ${k6.errorRatePercent} (${k6.errorCount}/${k6.errorCountTotal})`);
  if (k6.latency) {
    lines.push(`- **Latency (avg/p90/p95/p99)**: ${k6.latency.avgMs} / ${k6.latency.p90Ms} / ${k6.latency.p95Ms} / ${k6.latency.p99Ms} ms`);
  }
  lines.push('');

  lines.push('## Container Insights');
  lines.push('');
  if (summary.containerAws) {
    const cpu = summary.containerAws.CpuUtilized;
    const mem = summary.containerAws.MemoryUtilized;
    const rx = summary.containerAws.NetworkRxBytes;
    const tx = summary.containerAws.NetworkTxBytes;

    lines.push(`- **CpuUtilized Average**: min ${cpu.Average.summary?.min}, max ${cpu.Average.summary?.max}, avg ${cpu.Average.summary?.avg}`);
    lines.push(`- **CpuUtilized Maximum**: min ${cpu.Maximum.summary?.min}, max ${cpu.Maximum.summary?.max}, avg ${cpu.Maximum.summary?.avg}`);
    lines.push(`- **MemoryUtilized Average**: min ${mem.Average.summary?.min}, max ${mem.Average.summary?.max}, avg ${mem.Average.summary?.avg}`);
    lines.push(`- **MemoryUtilized Maximum**: min ${mem.Maximum.summary?.min}, max ${mem.Maximum.summary?.max}, avg ${mem.Maximum.summary?.avg}`);
    lines.push(`- **NetworkRxBytes Sum**: min ${rx.Sum.summary?.min}, max ${rx.Sum.summary?.max}, avg ${rx.Sum.summary?.avg}`);
    lines.push(`- **NetworkTxBytes Sum**: min ${tx.Sum.summary?.min}, max ${tx.Sum.summary?.max}, avg ${tx.Sum.summary?.avg}`);
  } else {
    for (const [section, modes] of Object.entries(summary.container || {})) {
      lines.push(`- **${section}**`);
      if (modes.average) {
        lines.push(`  - Average: min ${modes.average.min}, max ${modes.average.max}, avg ${modes.average.avg}`);
      }
      if (modes.maximum) {
        lines.push(`  - Maximum: min ${modes.maximum.min}, max ${modes.maximum.max}, avg ${modes.maximum.avg}`);
      }
    }
  }
  lines.push('');

  lines.push('## JVM / GC (Prometheus)');
  lines.push('');
  for (const [metricName, data] of Object.entries(summary.prometheus.metrics)) {
    const metricLabel = metricName.replace(/-/g, ' ');
    const summaryValue = data.summary;
    if (!summaryValue) continue;
    lines.push(`- **${metricLabel}**: min ${summaryValue.min}, max ${summaryValue.max}, avg ${summaryValue.avg}`);
  }

  if (summary.ecs) {
    lines.push('');
    lines.push('## ECS Service & Task');
    lines.push('');

    if (summary.ecs.error) {
      lines.push(`- **ECS Lookup Error**: ${summary.ecs.error}`);
    } else {
      lines.push(`- **Cluster**: ${summary.ecs.clusterName}`);
      lines.push(`- **Service**: ${summary.ecs.serviceName}`);
      lines.push(`- **Desired/Running Count**: ${summary.ecs.desiredCount}/${summary.ecs.runningCount}`);
      lines.push(`- **Task Definition**: ${summary.ecs.taskDefinitionArn}`);
      lines.push(`- **Task CPU/Memory**: ${summary.ecs.taskCpu}/${summary.ecs.taskMemory}`);
      lines.push('');
      lines.push('### Container Definitions');
      for (const container of summary.ecs.containers || []) {
        lines.push(`- **${container.name}**: image ${container.image}, cpu ${container.cpu ?? 'n/a'}, memory ${container.memory ?? 'n/a'}, reservation ${container.memoryReservation ?? 'n/a'}`);
      }
    }
  }

  if (summary.rds) {
    lines.push('');
    lines.push('## RDS Database');
    lines.push('');

    if (summary.rds.error) {
      lines.push(`- **RDS Lookup Error**: ${summary.rds.error}`);
    } else {
      lines.push(`- **Instance ID**: ${summary.rds.instanceId}`);
      lines.push(`- **Instance Class**: ${summary.rds.instanceClass}`);
      lines.push(`- **Engine**: ${summary.rds.engine} ${summary.rds.engineVersion}`);
      lines.push(`- **Allocated Storage**: ${summary.rds.allocatedStorage} GB`);
      lines.push(`- **Max Allocated Storage**: ${summary.rds.maxAllocatedStorage ?? 'n/a'} GB`);
      lines.push(`- **Status**: ${summary.rds.status}`);
      lines.push(`- **Multi-AZ**: ${summary.rds.multiAZ ? 'Yes' : 'No'}`);
      lines.push(`- **Database**: ${summary.rds.databaseName}`);
    }
  }

  if (summary.rdsAws) {
    lines.push('');
    lines.push('## RDS Metrics');
    lines.push('');

    if (summary.rdsAws.error) {
      lines.push(`- **RDS Metrics Error**: ${summary.rdsAws.error}`);
    } else {
      const cpu = summary.rdsAws.CPUUtilization;
      const conn = summary.rdsAws.DatabaseConnections;
      const readLat = summary.rdsAws.ReadLatency;
      const writeLat = summary.rdsAws.WriteLatency;
      const readThr = summary.rdsAws.ReadThroughput;
      const writeThr = summary.rdsAws.WriteThroughput;
      const readOps = summary.rdsAws.ReadIOPS;
      const writeOps = summary.rdsAws.WriteIOPS;

      lines.push(`- **CPU Utilization Average**: min ${cpu.Average.summary?.min?.toFixed(2)}%, max ${cpu.Average.summary?.max?.toFixed(2)}%, avg ${cpu.Average.summary?.avg?.toFixed(2)}%`);
      lines.push(`- **CPU Utilization Maximum**: min ${cpu.Maximum.summary?.min?.toFixed(2)}%, max ${cpu.Maximum.summary?.max?.toFixed(2)}%, avg ${cpu.Maximum.summary?.avg?.toFixed(2)}%`);
      lines.push(`- **Connections Average**: min ${conn.Average.summary?.min?.toFixed(1)}, max ${conn.Average.summary?.max?.toFixed(1)}, avg ${conn.Average.summary?.avg?.toFixed(1)}`);
      lines.push(`- **Connections Maximum**: min ${conn.Maximum.summary?.min?.toFixed(1)}, max ${conn.Maximum.summary?.max?.toFixed(1)}, avg ${conn.Maximum.summary?.avg?.toFixed(1)}`);
      lines.push(`- **Read Latency Average**: min ${readLat.Average.summary?.min?.toFixed(3)} ms, max ${readLat.Average.summary?.max?.toFixed(3)} ms, avg ${readLat.Average.summary?.avg?.toFixed(3)} ms`);
      lines.push(`- **Read Latency Maximum**: min ${readLat.Maximum.summary?.min?.toFixed(3)} ms, max ${readLat.Maximum.summary?.max?.toFixed(3)} ms, avg ${readLat.Maximum.summary?.avg?.toFixed(3)} ms`);
      lines.push(`- **Write Latency Average**: min ${writeLat.Average.summary?.min?.toFixed(3)} ms, max ${writeLat.Average.summary?.max?.toFixed(3)} ms, avg ${writeLat.Average.summary?.avg?.toFixed(3)} ms`);
      lines.push(`- **Write Latency Maximum**: min ${writeLat.Maximum.summary?.min?.toFixed(3)} ms, max ${writeLat.Maximum.summary?.max?.toFixed(3)} ms, avg ${writeLat.Maximum.summary?.avg?.toFixed(3)} ms`);
      lines.push(`- **Read Throughput Average**: min ${readThr.Average.summary?.min?.toFixed(0)} bytes/sec, max ${readThr.Average.summary?.max?.toFixed(0)} bytes/sec, avg ${readThr.Average.summary?.avg?.toFixed(0)} bytes/sec`);
      lines.push(`- **Write Throughput Average**: min ${writeThr.Average.summary?.min?.toFixed(0)} bytes/sec, max ${writeThr.Average.summary?.max?.toFixed(0)} bytes/sec, avg ${writeThr.Average.summary?.avg?.toFixed(0)} bytes/sec`);
      lines.push(`- **Read IOPS Average**: min ${readOps.Average.summary?.min?.toFixed(1)}, max ${readOps.Average.summary?.max?.toFixed(1)}, avg ${readOps.Average.summary?.avg?.toFixed(1)}`);
      lines.push(`- **Write IOPS Average**: min ${writeOps.Average.summary?.min?.toFixed(1)}, max ${writeOps.Average.summary?.max?.toFixed(1)}, avg ${writeOps.Average.summary?.avg?.toFixed(1)}`);
    }
  }

  lines.push('');
  lines.push('## Files Used');
  lines.push('');
  lines.push(`- ${summary.files.k6Summary}`);

  lines.push('');
  return lines.join('\n');
}

async function main() {
  const configPath = process.argv[2] || path.join(__dirname, 'config.json');
  const config = readJson(configPath);

  const inputDir = path.resolve(config.inputDir);
  const outputDir = path.resolve(config.outputDir);

  const files = {
    k6Summary: path.join(inputDir, config.files.k6Summary)
  };

  const k6Text = fs.readFileSync(files.k6Summary, 'utf8');

  const k6Summary = parseK6Summary(k6Text);

  let promRawData = null;
  let promSummary = null;
  if (config.prometheus && config.prometheus.fetchMetrics) {
    try {
      promRawData = await fetchPrometheusMetrics(config.prometheus, config.run);
      if (promRawData) {
        promSummary = parsePromStats(promRawData);
        const promStatsOut = path.join(outputDir, 'prom-stats.json');
        writeFile(promStatsOut, JSON.stringify(promRawData, null, 2));
        console.log(`Wrote Prometheus stats: ${promStatsOut}`);
      }
    } catch (error) {
      console.error(`Error fetching Prometheus metrics: ${error.message}`);
      promSummary = { metrics: {}, labels: {} };
    }
  } else {
    promSummary = { metrics: {}, labels: {} };
  }

  let ecsSummary = null;
  if (config.ecs) {
    try {
      ecsSummary = await fetchEcsInfo(config.ecs);
    } catch (error) {
      ecsSummary = { error: error.message };
    }
  }

  let rdsSummary = null;
  if (config.rds) {
    try {
      rdsSummary = await fetchRdsInfo(config.rds);
    } catch (error) {
      rdsSummary = { error: error.message };
    }
  }

  let rdsAwsSummary = null;
  if (config.rds && config.rds.fetchMetrics) {
    try {
      rdsAwsSummary = await fetchRdsMetrics(config.rds, config.run);
      const rdsStatsOut = path.join(outputDir, 'rds-stats.json');
      writeFile(rdsStatsOut, JSON.stringify(rdsAwsSummary, null, 2));
      console.log(`Wrote RDS stats: ${rdsStatsOut}`);
    } catch (error) {
      rdsAwsSummary = { error: error.message };
      console.error(`Error fetching RDS metrics: ${error.message}`);
    }
  }

  let containerAwsSummary = null;
  if (config.ecs && config.ecs.fetchMetrics) {
    try {
      containerAwsSummary = await fetchContainerMetrics(config.ecs, config.run);
      const awsStatsOut = path.join(outputDir, 'container-stats.json');
      writeFile(awsStatsOut, JSON.stringify(containerAwsSummary, null, 2));
      console.log(`Wrote container stats (AWS): ${awsStatsOut}`);
    } catch (error) {
      containerAwsSummary = { error: error.message };
      console.error(`Error fetching AWS container metrics: ${error.message}`);
    }
  }

  const output = {
    run: config.run,
    k6: k6Summary,
    containerAws: containerAwsSummary,
    prometheus: promSummary,
    ecs: ecsSummary,
    rds: rdsSummary,
    rdsAws: rdsAwsSummary,
    files: files,
    generatedAt: new Date().toISOString()
  };

  const jsonOut = path.join(outputDir, 'summary.json');
  const mdOut = path.join(outputDir, 'summary.md');

  writeFile(jsonOut, JSON.stringify(output, null, 2));
  writeFile(mdOut, formatMarkdown(output));

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
}

main();
