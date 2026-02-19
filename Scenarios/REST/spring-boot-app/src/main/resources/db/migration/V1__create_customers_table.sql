-- Create customers table
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for search performance
CREATE INDEX idx_customer_email ON customers(email);

-- Create index on names for search performance
CREATE INDEX idx_customer_names ON customers(first_name, last_name);
