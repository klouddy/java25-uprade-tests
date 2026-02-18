package com.benchmark.app.repository;

import com.benchmark.app.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    /**
     * Search customers by name or email.
     * Note: This uses LIKE with wildcards which may not fully utilize indexes.
     * For production use with large datasets, consider:
     * - PostgreSQL trigram indexes (CREATE EXTENSION pg_trgm; CREATE INDEX ... USING gin)
     * - Full-text search
     * - Or prefix matching if search pattern allows
     * 
     * This implementation is intentionally kept simple for benchmarking purposes.
     */
    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Customer> searchCustomers(@Param("search") String search);
}
