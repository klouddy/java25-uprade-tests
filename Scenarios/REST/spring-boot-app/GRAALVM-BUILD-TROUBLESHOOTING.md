# GraalVM Native Image Build Issues & Solutions

## Problem: native-image compilation fails silently with exit code 1

### Root Causes
1. **Wrong pom.xml file** - Dockerfile was copying `pom.xml` instead of `pom-graalvm.xml` 
2. **Insufficient memory** - Maven and native-image compiler need separate heap allocations
3. **Missing runtime initialization hints** - Some libraries need `--initialize-at-run-time`
4. **Version mismatches** - Different library versions between build and metadata
5. **Conflicting GC settings** - Mixing `-O3` optimization with explicit GC specifications causes "Multiple garbage collectors selected" error

## Problem: "Multiple garbage collectors selected" error

### Cause
Using `-O3` optimization combined with `-J-XX:+UseSerialGC` causes conflicts because different optimization levels prefer different garbage collectors.

### Solution
Use `-O2` optimization only, without explicit GC flags:
```xml
<buildArg>-O2</buildArg>
<!-- Remove: <buildArg>-J-XX:+UseSerialGC</buildArg> -->
```

native-image will automatically choose the appropriate GC (G1GC on modern systems).

### Solutions Applied

#### 1. **Use correct pom file** (FIXED)
```dockerfile
# ❌ WRONG
COPY pom.xml ./

# ✅ CORRECT
COPY pom-graalvm.xml pom.xml
```

#### 2. **Increase Maven heap size** (FIXED)
```dockerfile
# Maven itself needs heap for dependency resolution
RUN MAVEN_OPTS="-Xmx2g" ./mvnw dependency:go-offline -Pnative

# Native-image compiler also needs heap (configured via pom property)
RUN MAVEN_OPTS="-Xmx2g" ./mvnw -Pnative clean native:compile
```

#### 3. **Remove conflicting GC and optimization settings** (FIXED)
Don't mix `-O3` optimization with explicit GC specifications. Use `-O2` with default GC:

```xml
<buildArgs>
    <buildArg>--verbose</buildArg>
    <buildArg>--no-fallback</buildArg>
    <buildArg>--enable-url-protocols=http,https</buildArg>
    <buildArg>-O2</buildArg>  <!-- Not -O3 to avoid GC conflicts -->
    <!-- No -J-XX:+UseSerialGC here - let native-image choose -->
    <buildArg>${graalvm.native.image.heap.size}</buildArg>
    <buildArg>--initialize-at-run-time=org.apache.commons.logging.LogFactoryService,org.apache.commons.logging.LogFactory</buildArg>
</buildArgs>
```

#### 4. **All native-image options in pom.xml** (FIXED)
Don't use `-Dorg.graalvm.buildtools.native.option=` overrides on command line. Instead, keep them all in `pom.xml`.

### Memory Allocation Recommendations

Current configuration uses `-O2` optimization (balanced build time/performance).

| Environment | Maven `-Xmx` | native-image `-Xmx` | Total | Status |
|---|---|---|---|---|
| Local (4GB RAM) | 1.0g | 2.0g | 3.0g | ✅ Works |
| Local (8GB RAM) | 1.5g | 3.0g | 4.5g | ✅ Recommended |
| GitHub Actions (7GB) | 1.5g | 3.5g | 5.0g | ✅ Works |
| AWS CodeBuild (4GB) | 1.0g | 2.5g | 3.5g | ✅ Works |
| AWS CodeBuild (8GB+) | 1.5g | 3.5g | 5.0g | ✅ Recommended |

**Note:** These are lower than `-O3` settings because `-O2` requires less memory.

### If build still fails:

**1. Increase memory allocation:**
```xml
<!-- If still OOM: -->
<graalvm.native.image.heap.size>-J-Xmx4000m</graalvm.native.image.heap.size>
```

**2. Further reduce optimization (slower build, more stable):**
```xml
<!-- Change from: <buildArg>-O2</buildArg> -->
<!-- To: -->
<buildArg>-O1</buildArg>
```

**3. Add extra heap options:**
```xml
<!-- For container builds with limited resources -->
<buildArg>-Dcom.oracle.svm.useLLVMBackend=false</buildArg>
```

**4. Check for reflection issues:**
If the error shows missing classes/methods, add to `buildArgs`:
```xml
<buildArg>--trace-class-initialization=org.springframework.boot.SpringApplication</buildArg>
```

**5. For AWS SDK issues:**
Ensure this initialization hint is present (already in our pom):
```xml
<buildArg>--initialize-at-run-time=org.apache.commons.logging.LogFactoryService,org.apache.commons.logging.LogFactory</buildArg>
```

### Local Testing

To test locally with proper memory:

```bash
# Start Docker with enough memory
docker run --memory=6g -it ghcr.io/graalvm/native-image-community:21-ol9 /bin/bash

# Inside container:
cd /app
MAVEN_OPTS="-Xmx2g" mvn -Pnative clean native:compile -DskipTests
```

### GitHub Actions Troubleshooting

If GitHub Actions build fails:

1. Check available memory: `free -h` (should show ~7GB)
2. Enable verbose output: Add `--verbose` to buildArgs (already present)
3. Check build log for actual error (scroll past dependency downloads)
4. Common fixes:
   - Reduce `graalvm.native.image.heap.size` to `-J-Xmx3000m`
   - Reduce Maven MAVEN_OPTS to `-Xmx1.5g`
   - Add `--initialize-at-build-time=` for serialization-heavy classes

### References

- [GraalVM native-image options](https://www.graalvm.org/latest/reference-manual/native-image/overview/Options/)
- [native-maven-plugin docs](https://graalvm.github.io/native-build-tools/latest/maven-plugin.html)
- [Spring Boot 3 GraalVM native support](https://spring.io/blog/2023/10/09/spring-boot-3-2-0-rc1-released)
