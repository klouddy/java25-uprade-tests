# GraalVM Native Image Build Issues & Solutions

## Problem: native-image compilation fails silently with exit code 1

### Root Causes
1. **Wrong pom.xml file** - Dockerfile was copying `pom.xml` instead of `pom-graalvm.xml` 
2. **Insufficient memory** - Maven and native-image compiler need separate heap allocations
3. **Missing runtime initialization hints** - Some libraries need `--initialize-at-run-time`
4. **Version mismatches** - Different library versions between build and metadata

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

#### 3. **All native-image options in pom.xml** (FIXED)
Don't use `-Dorg.graalvm.buildtools.native.option=` overrides on command line. Instead, keep them all in `pom.xml`:

```xml
<buildArgs>
    <buildArg>--verbose</buildArg>
    <buildArg>--no-fallback</buildArg>
    <buildArg>--enable-url-protocols=http,https</buildArg>
    <buildArg>-O3</buildArg>
    <buildArg>-J-XX:+UseSerialGC</buildArg>
    <buildArg>${graalvm.native.image.heap.size}</buildArg>
    <buildArg>--initialize-at-run-time=org.apache.commons.logging.LogFactoryService,org.apache.commons.logging.LogFactory</buildArg>
</buildArgs>
```

### Memory Allocation Recommendations

| Environment | Maven `-Xmx` | native-image `-Xmx` | Total | Status |
|---|---|---|---|---|
| Local (4GB RAM) | 1.5g | 2.0g | 3.5g | ✅ Works |
| Local (8GB RAM) | 2g | 3g | 5g | ✅ Recommended |
| GitHub Actions (7GB) | 2g | 3.5g | 5.5g | ✅ Works |
| AWS CodeBuild (4GB) | 1.5g | 2.5g | 4g | ⚠️ Tight |
| AWS CodeBuild (8GB+) | 2g | 3.5g | 5.5g | ✅ Recommended |

### If build still fails:

**1. Reduce optimization level:**
```xml
<!-- Change from: <buildArg>-O3</buildArg> -->
<!-- To: -->
<buildArg>-O2</buildArg>
```

**2. Reduce heap size:**
```xml
<graalvm.native.image.heap.size>-J-Xmx2500m</graalvm.native.image.heap.size>
```

**3. Use simpler GC:**
Already using `-J-XX:+UseSerialGC` which is most efficient. Don't change this.

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
