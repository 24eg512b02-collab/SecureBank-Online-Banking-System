package com.securebank.controller;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.TransactionType;
import com.securebank.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** Restricted to ROLE_ADMIN by SecurityConfig (/api/admin/**). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService admin;

    public AdminController(AdminService admin) { this.admin = admin; }

    @GetMapping("/summary")
    public AdminSummary summary() { return admin.summary(); }

    @GetMapping("/customers")
    public PageResponse<CustomerRow> customers(@RequestParam(required = false) String q,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return admin.customers(q, page, size);
    }

    @PatchMapping("/customers/{userId}/status")
    public CustomerRow setStatus(@PathVariable Long userId, @Valid @RequestBody StatusUpdateRequest req) {
        return admin.setStatus(userId, req.active());
    }

    @GetMapping("/transactions")
    public PageResponse<TransactionResponse> transactions(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return admin.transactions(type, from, to, q, page, size);
    }
}
