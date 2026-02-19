package com.benchmark.app.controller;

import com.benchmark.app.dto.CustomerRequest;
import com.benchmark.app.dto.CustomerResponse;
import com.benchmark.app.entity.Customer;
import com.benchmark.app.repository.CustomerRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable Long id) {
        return customerRepository.findById(id)
            .map(CustomerResponse::fromEntity)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> searchCustomers(
        @RequestParam(required = false) String search) {
        
        if (search == null || search.trim().isEmpty()) {
            List<CustomerResponse> customers = customerRepository.findAll()
                .stream()
                .map(CustomerResponse::fromEntity)
                .collect(Collectors.toList());
            return ResponseEntity.ok(customers);
        }

        List<CustomerResponse> customers = customerRepository.searchCustomers(search)
            .stream()
            .map(CustomerResponse::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(customers);
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(
        @Valid @RequestBody CustomerRequest request) {
        
        Customer customer = request.toEntity();
        Customer saved = customerRepository.save(customer);
        
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(CustomerResponse.fromEntity(saved));
    }
}
