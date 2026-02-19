package com.benchmark.app;

import com.benchmark.app.dto.CustomerRequest;
import com.benchmark.app.dto.CustomerResponse;
import com.benchmark.app.dto.OrderRequest;
import com.benchmark.app.dto.OrderResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BenchmarkApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl() {
        return "http://localhost:" + port;
    }

    @Test
    void contextLoads() {
        // Verify application starts successfully
    }

    @Test
    void testHealthEndpoint() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl() + "/actuator/health",
            String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"status\":\"UP\"");
    }

    @Test
    void testCreateAndGetCustomer() {
        // Create customer
        CustomerRequest request = new CustomerRequest(
            "Test",
            "User",
            "test" + System.currentTimeMillis() + "@example.com"
        );
        
        ResponseEntity<CustomerResponse> createResponse = restTemplate.postForEntity(
            baseUrl() + "/customers",
            request,
            CustomerResponse.class
        );
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody()).isNotNull();
        assertThat(createResponse.getBody().getId()).isNotNull();
        assertThat(createResponse.getBody().getFirstName()).isEqualTo("Test");
        
        // Get customer by ID
        Long customerId = createResponse.getBody().getId();
        ResponseEntity<CustomerResponse> getResponse = restTemplate.getForEntity(
            baseUrl() + "/customers/" + customerId,
            CustomerResponse.class
        );
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody()).isNotNull();
        assertThat(getResponse.getBody().getId()).isEqualTo(customerId);
        assertThat(getResponse.getBody().getEmail()).isEqualTo(request.getEmail());
    }

    @Test
    void testSearchCustomers() {
        // Create a customer with unique name
        String uniqueName = "SearchTest" + System.currentTimeMillis();
        CustomerRequest request = new CustomerRequest(
            uniqueName,
            "User",
            uniqueName.toLowerCase() + "@example.com"
        );
        
        restTemplate.postForEntity(
            baseUrl() + "/customers",
            request,
            CustomerResponse.class
        );
        
        // Search for the customer
        ResponseEntity<CustomerResponse[]> searchResponse = restTemplate.getForEntity(
            baseUrl() + "/customers?search=" + uniqueName,
            CustomerResponse[].class
        );
        
        assertThat(searchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(searchResponse.getBody()).isNotNull();
        assertThat(searchResponse.getBody()).hasSizeGreaterThan(0);
        assertThat(searchResponse.getBody()[0].getFirstName()).isEqualTo(uniqueName);
    }

    @Test
    void testCreateOrder() {
        // Create customer first
        CustomerRequest customerRequest = new CustomerRequest(
            "Order",
            "Test",
            "order" + System.currentTimeMillis() + "@example.com"
        );
        
        ResponseEntity<CustomerResponse> customerResponse = restTemplate.postForEntity(
            baseUrl() + "/customers",
            customerRequest,
            CustomerResponse.class
        );
        
        Long customerId = customerResponse.getBody().getId();
        
        // Create order
        OrderRequest orderRequest = new OrderRequest(customerId, new BigDecimal("99.99"));
        
        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
            baseUrl() + "/orders",
            orderRequest,
            OrderResponse.class
        );
        
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(orderResponse.getBody()).isNotNull();
        assertThat(orderResponse.getBody().getId()).isNotNull();
        assertThat(orderResponse.getBody().getCustomerId()).isEqualTo(customerId);
        assertThat(orderResponse.getBody().getAmount()).isEqualByComparingTo(new BigDecimal("99.99"));
    }

    @Test
    void testCreateOrderWithInvalidCustomer() {
        // Try to create order with non-existent customer
        OrderRequest orderRequest = new OrderRequest(999999L, new BigDecimal("99.99"));
        
        ResponseEntity<String> response = restTemplate.postForEntity(
            baseUrl() + "/orders",
            orderRequest,
            String.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("does not exist");
    }

    @Test
    void testGetNonExistentCustomer() {
        ResponseEntity<CustomerResponse> response = restTemplate.getForEntity(
            baseUrl() + "/customers/999999",
            CustomerResponse.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testMetricsEndpoint() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl() + "/actuator/metrics",
            String.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("jvm.memory.used");
        assertThat(response.getBody()).contains("jvm.gc");
        assertThat(response.getBody()).contains("http.server.requests");
    }
}
