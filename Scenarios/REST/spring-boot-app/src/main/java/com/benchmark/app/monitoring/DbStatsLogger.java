package com.benchmark.app.monitoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class DbStatsLogger {
    private static final Logger logger = LoggerFactory.getLogger(DbStatsLogger.class);
    private static final long ERROR_LOG_THROTTLE_MS = 60_000L;

    private final DataSource dataSource;
    private final boolean enabled;
    private final AtomicLong lastErrorLogMs = new AtomicLong(0L);
    private volatile DbDatabaseStats lastDbStats;

    public DbStatsLogger(DataSource dataSource,
                         @Value("${app.db-stats.enabled:false}") boolean enabled) {
        this.dataSource = dataSource;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelayString = "${app.db-stats.interval-ms:10000}")
    public void logStats() {
        if (!enabled) {
            return;
        }

        int hikariActive = -1;
        int hikariIdle = -1;
        int hikariTotal = -1;
        int hikariAwaiting = -1;
        PoolStats poolStats = getPoolStats();
        if (poolStats != null) {
            hikariActive = poolStats.active;
            hikariIdle = poolStats.idle;
            hikariTotal = poolStats.total;
            hikariAwaiting = poolStats.waiting;
        }

        DbActivity activity = queryPgStatActivity();
        DbDatabaseStats dbStats = queryPgStatDatabase();
        DbDatabaseStats deltaStats = calculateDelta(dbStats);
        logger.info(
            "db_stats ts={} hikari_active={} hikari_idle={} hikari_total={} hikari_waiting={} pg_active={} pg_idle={} pg_idle_tx={} pg_waiting={} pg_total={} pg_xact_commit={} pg_xact_rollback={} pg_blks_read={} pg_blks_hit={} pg_temp_files={} pg_temp_bytes={} pg_xact_commit_d={} pg_xact_rollback_d={} pg_blks_read_d={} pg_blks_hit_d={} pg_temp_files_d={} pg_temp_bytes_d={}",
            Instant.now().toString(),
            hikariActive,
            hikariIdle,
            hikariTotal,
            hikariAwaiting,
            activity.active,
            activity.idle,
            activity.idleInTxn,
            activity.waiting,
            activity.total,
            dbStats.xactCommit,
            dbStats.xactRollback,
            dbStats.blksRead,
            dbStats.blksHit,
            dbStats.tempFiles,
            dbStats.tempBytes,
            deltaStats.xactCommit,
            deltaStats.xactRollback,
            deltaStats.blksRead,
            deltaStats.blksHit,
            deltaStats.tempFiles,
            deltaStats.tempBytes
        );
    }

    private DbActivity queryPgStatActivity() {
        String sql = "SELECT " +
                "SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) AS active, " +
                "SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) AS idle, " +
                "SUM(CASE WHEN state = 'idle in transaction' THEN 1 ELSE 0 END) AS idle_in_tx, " +
                "SUM(CASE WHEN wait_event IS NOT NULL THEN 1 ELSE 0 END) AS waiting, " +
                "COUNT(*) AS total " +
                "FROM pg_stat_activity WHERE datname = current_database()";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return new DbActivity(
                        rs.getInt("active"),
                        rs.getInt("idle"),
                        rs.getInt("idle_in_tx"),
                        rs.getInt("waiting"),
                        rs.getInt("total")
                );
            }
        } catch (Exception ex) {
            throttleWarn("db stats query failed: " + ex.getMessage());
        }

        return DbActivity.empty();
    }

    private PoolStats getPoolStats() {
        try {
            String className = dataSource.getClass().getName();
            if (!className.contains("Hikari")) {
                return null;
            }
            Object poolMxBean = dataSource.getClass().getMethod("getHikariPoolMXBean").invoke(dataSource);
            if (poolMxBean == null) {
                return null;
            }
            int active = (int) poolMxBean.getClass().getMethod("getActiveConnections").invoke(poolMxBean);
            int idle = (int) poolMxBean.getClass().getMethod("getIdleConnections").invoke(poolMxBean);
            int total = (int) poolMxBean.getClass().getMethod("getTotalConnections").invoke(poolMxBean);
            int waiting = (int) poolMxBean.getClass().getMethod("getThreadsAwaitingConnection").invoke(poolMxBean);
            return new PoolStats(active, idle, total, waiting);
        } catch (Exception ex) {
            throttleWarn("db pool stats unavailable: " + ex.getMessage());
            return null;
        }
    }

    private DbDatabaseStats queryPgStatDatabase() {
        String sql = "SELECT " +
                "xact_commit, " +
                "xact_rollback, " +
                "blks_read, " +
                "blks_hit, " +
                "temp_files, " +
                "temp_bytes " +
                "FROM pg_stat_database WHERE datname = current_database()";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return new DbDatabaseStats(
                        rs.getLong("xact_commit"),
                        rs.getLong("xact_rollback"),
                        rs.getLong("blks_read"),
                        rs.getLong("blks_hit"),
                        rs.getLong("temp_files"),
                        rs.getLong("temp_bytes")
                );
            }
        } catch (Exception ex) {
            throttleWarn("db stats query failed: " + ex.getMessage());
        }

        return DbDatabaseStats.empty();
    }

    private DbDatabaseStats calculateDelta(DbDatabaseStats current) {
        DbDatabaseStats previous = lastDbStats;
        lastDbStats = current;
        if (previous == null || current.isEmpty() || previous.isEmpty()) {
            return DbDatabaseStats.zero();
        }
        return new DbDatabaseStats(
                safeDelta(current.xactCommit, previous.xactCommit),
                safeDelta(current.xactRollback, previous.xactRollback),
                safeDelta(current.blksRead, previous.blksRead),
                safeDelta(current.blksHit, previous.blksHit),
                safeDelta(current.tempFiles, previous.tempFiles),
                safeDelta(current.tempBytes, previous.tempBytes)
        );
    }

    private long safeDelta(long current, long previous) {
        if (current < 0 || previous < 0) {
            return -1;
        }
        return Math.max(0L, current - previous);
    }

    private void throttleWarn(String message) {
        long now = System.currentTimeMillis();
        long last = lastErrorLogMs.get();
        if (now - last >= ERROR_LOG_THROTTLE_MS && lastErrorLogMs.compareAndSet(last, now)) {
            logger.warn(message);
        }
    }

    private static class DbActivity {
        final int active;
        final int idle;
        final int idleInTxn;
        final int waiting;
        final int total;

        private DbActivity(int active, int idle, int idleInTxn, int waiting, int total) {
            this.active = active;
            this.idle = idle;
            this.idleInTxn = idleInTxn;
            this.waiting = waiting;
            this.total = total;
        }

        static DbActivity empty() {
            return new DbActivity(-1, -1, -1, -1, -1);
        }
    }

    private static class PoolStats {
        final int active;
        final int idle;
        final int total;
        final int waiting;

        private PoolStats(int active, int idle, int total, int waiting) {
            this.active = active;
            this.idle = idle;
            this.total = total;
            this.waiting = waiting;
        }
    }

    private static class DbDatabaseStats {
        final long xactCommit;
        final long xactRollback;
        final long blksRead;
        final long blksHit;
        final long tempFiles;
        final long tempBytes;

        private DbDatabaseStats(long xactCommit,
                                long xactRollback,
                                long blksRead,
                                long blksHit,
                                long tempFiles,
                                long tempBytes) {
            this.xactCommit = xactCommit;
            this.xactRollback = xactRollback;
            this.blksRead = blksRead;
            this.blksHit = blksHit;
            this.tempFiles = tempFiles;
            this.tempBytes = tempBytes;
        }

        static DbDatabaseStats empty() {
            return new DbDatabaseStats(-1, -1, -1, -1, -1, -1);
        }

        static DbDatabaseStats zero() {
            return new DbDatabaseStats(0, 0, 0, 0, 0, 0);
        }

        boolean isEmpty() {
            return xactCommit < 0
                    || xactRollback < 0
                    || blksRead < 0
                    || blksHit < 0
                    || tempFiles < 0
                    || tempBytes < 0;
        }
    }
}
