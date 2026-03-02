# GraalVM Option Added to Runner Script

## Summary of Changes

The `Scenarios/runner/setup-run.js` script now supports **GraalVM Native Image** as a Java version option alongside Java 17, 21, and 25.

## What Changed

### 1. Java Version Selection (setup-run.js)
- Added `GraalVM` to the Java version choices
- Choices now: `['17', '21', '25', 'GraalVM']`

### 2. Smart Defaults for GraalVM
When you select GraalVM:

| Setting | Regular JVM | GraalVM Native |
|---------|------------|-----------------|
| **CPU Units** | 512 | 256 |
| **Memory (MB)** | 2048 | 512 |
| **JVM Options** | `-XX:+UseG1GC -Xmx1024m` | N/A (native image) |

The script automatically adjusts defaults based on your selection.

### 3. Dockerfile Handling
- **For Java 17/21/25**: Uses `Dockerfile.java17`, `Dockerfile.java21`, `Dockerfile.java25`
- **For GraalVM**: Uses `Dockerfile.graalvm` (the new file we created)

### 4. JVM Option Modification
- **For Java versions**: Script modifies the Dockerfile to inject your JVM options
- **For GraalVM**: Skips JVM modification (native images don't use JVM options)

### 5. Directory Structure
- **Java versions**: Creates `runs/Scenarios/{TYPE}/{scenario}/java17|21|25/{date}/{run}/`
- **GraalVM**: Creates `runs/Scenarios/{TYPE}/{scenario}/graalvm/{date}/{run}/`

Example folder structures after running setup:
```
runs/Scenarios/REST/read-heavy/
├── java17/2026-03-02/1/          # Java 17 run
├── java21/2026-03-02/1/          # Java 21 run  
├── java25/2026-03-02/1/          # Java 25 run
└── graalvm/2026-03-02/1/         # GraalVM native image run
```

### 6. Image Tagging
- **Java versions**: `benchmark-app:rest-java21-scenario1-2026-03-02-1`
- **GraalVM**: `benchmark-app:rest-graalvm-scenario1-2026-03-02-1`

The `java` prefix is replaced with `graalvm` for native image runs.

## Usage

```bash
cd Scenarios/runner

# Run setup as usual
npm run setup
```

When prompted:
```
? What scenario type are you running? REST
? Which load test scenario? Read Heavy
? Java version? · GraalVM          # ← NEW OPTION
? JVM options · (auto: N/A - native image)
? CPU units (ECS) · (auto: 256)
? Memory (MB, ECS) · (auto: 512)
? Virtual Threads enabled? No
? Database pool size 20
```

The rest of the workflow is identical to Java versions:
1. Builds `Dockerfile.graalvm` with optimizations for Fargate
2. Tags and pushes to ECR
3. Creates task definition with reduced CPU (256) and memory (512)
4. Saves run configuration for later deployment/benchmarking

## Workflow for Comparison Testing

### Example: Compare Java 21 vs GraalVM for Cold Start

```bash
# Run 1: Standard Java 21
npm run setup
# Select: Scenario: Cold Start | Java: 21 | CPU: 512 | Memory: 2048 | DB Pool: 20

# Run 2: GraalVM Native Image
npm run setup
# Select: Scenario: Cold Start | Java: GraalVM | CPU: 256 | Memory: 512 | DB Pool: 20

# Deploy both to ECS
npm run aws-bootstrap   # If infrastructure not set up
npm run deploy-task     # Deploy Java 21 version first
npm run deploy-task     # Deploy GraalVM version second

# Run k6 scenario 6 (Cold Start) against both and compare:
# - Startup latency
# - Memory footprint
# - Cost per request (CPU+Memory)
```

## Files Modified

1. **Scenarios/runner/setup-run.js**
   - Added `GraalVM` to javaVersion choices
   - Modified `readDockerfileTemplate()` to handle Dockerfile.graalvm
   - Updated default CPU/memory based on JVM selection
   - Skip JVM option modifications for GraalVM
   - Use `graalvm` in folder structure and image tags for GraalVM

2. **Scenarios/runner/README.md**
   - Added note about GraalVM option in prompts section
   - Added new "GraalVM Native Image Option" section
   - Added comparison table (JVM vs GraalVM)
   - Added use cases section
   - Updated folder structure documentation

## Files Already Created

These GraalVM build artifacts were created previously:

1. **Dockerfile.graalvm** - Multi-stage Docker build using GraalVM native-image
2. **pom-graalvm.xml** - Maven configuration with native image profile
3. **docker-compose-graalvm.yml** - Local testing setup for GraalVM app
4. **README-graalvm.md** - Detailed GraalVM documentation

When you select GraalVM in setup, it will use the existing `Dockerfile.graalvm` file.

## Next Steps

1. **Test GraalVM setup flow**: Run `npm run setup` and select GraalVM to verify it works
2. **Deploy GraalVM task**: Use `npm run deploy-task` to deploy the GraalVM version
3. **Run benchmarks**: Execute k6 load tests comparing Java vX vs GraalVM
4. **Analyze results**: Check memory/CPU/throughput differences in summary.json files

## Notes

- GraalVM native image build takes 5-10 minutes (vs 1-2 minutes for JVM)
- The build happens inside Docker, so GraalVM doesn't need to be installed locally
- All other scripts (aws-bootstrap, deploy-task, k6-tests) work the same with GraalVM runs
- Configuration files will show `"javaVersion": "GraalVM"` for easy identification
