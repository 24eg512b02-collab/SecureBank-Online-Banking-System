package com.securebank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** SecureBank - academic demonstration only. Simulated funds; not connected to any real bank or payment network. */
@SpringBootApplication
public class SecureBankApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecureBankApplication.class, args);
    }
}
