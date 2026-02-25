package com.benchmark.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
@EnableScheduling
public class BenchmarkApplication {

    public static void main(String[] args) {
        SpringApplication.run(BenchmarkApplication.class, args);
    }

    /**
     * Clear database on startup if CLEAR_DB_ON_START=true
     * Useful for benchmarking between test runs
     */
    @Bean
    public CommandLineRunner clearDatabaseOnStartup(
            DataSource dataSource, 
            @Value("${app.clear-db-on-start:false}") boolean clearDbOnStart) {
        return args -> {
            if (clearDbOnStart) {
                try (Connection conn = dataSource.getConnection()) {
                    conn.createStatement().execute("TRUNCATE TABLE orders CASCADE");
                    conn.createStatement().execute("TRUNCATE TABLE customers CASCADE");
                    System.out.println("✓ Database cleared on startup");
                } catch (Exception e) {
                    System.err.println("⚠️  Failed to clear database: " + e.getMessage());
                }
            }
        };
    }
}
