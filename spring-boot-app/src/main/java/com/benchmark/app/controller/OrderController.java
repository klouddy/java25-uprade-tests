package com.benchmark.app.controller;

import com.benchmark.app.dto.OrderRequest;
import com.benchmark.app.dto.OrderResponse;
import com.benchmark.app.entity.Order;
import com.benchmark.app.repository.CustomerRepository;
import com.benchmark.app.repository.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public OrderController(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequest request) {
        // Validate that customer exists
        if (!customerRepository.existsById(request.getCustomerId())) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("Customer with ID " + request.getCustomerId() + " does not exist");
        }

        Order order = request.toEntity();
        Order saved = orderRepository.save(order);
        
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(OrderResponse.fromEntity(saved));
    }
}
