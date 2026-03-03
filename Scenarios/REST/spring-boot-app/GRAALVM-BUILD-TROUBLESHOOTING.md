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

## Problem: "OutOfMemoryError: GC overhead limit exceeded"

### Cause
native-image compiler needs significant heap space for Spring Boot applications with many dependencies (AWS SDK, Hibernate, etc.). GitHub Actions VMs have ~15GB but default heap was only 3.5GB.

### Solution
Increase native-image heap significantly and use quick build optimization:
```xml
<graalvm.native.image.heap.size>-J-Xmx8g</graalvm.native.image.heap.size>
```

And use `-Ob` (quick build) instead of `-O2`:
```xml
<buildArg>-Ob</buildArg>  <!-- Quick build: faster, less memory -->
```

### Memory Allocation Recommendations

Current configuration uses `-Ob` quick build optimization (minimal memory, fast compile).

| Environment | Maven `-Xmx` | native-image `-Xmx` | Total | Build Time | Status |
|---|---|---|---|---|---|
| GitHub Actions (15GB) | 2g | 8g | 10g | ~10-15 min | ✅ Recommended |
| AWS CodeBuild (8GB) | 1.5g | 5g | 6.5g | ~10-15 min | ✅ Works |
| AWS CodeBuild (15GB) | 2g | 8g | 10g | ~10-15 min | ✅ Recommended |
| Local (8GB RAM) | 1g | 4g | 5g | ~15-20 min | ⚠️ Tight |
| Local (16GB RAM) | 2g | 8g | 10g | ~10-15 min | ✅ Works |

**Optimization levels and memory:**
- `-Ob` (quick build): 4-8GB recommended, fastest compile, good performance
- `-O2` (moderate): 6-10GB recommended, slower compile, better performance  
- `-O3` (full): 8-12GB+ recommended, slowest compile, best performance

**Note:** For benchmarking, you may want to later rebuild with `-O2` or `-O3` for better runtime performance.

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
