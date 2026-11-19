package com.securebank.controller;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.TransactionType;
import com.securebank.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService service;

    public TransactionController(TransactionService service) { this.service = service; }

    @PostMapping("/deposit")
    public ResponseEntity<TransactionResponse> deposit(Authentication auth, @Valid @RequestBody MoneyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.deposit(auth.getName(), req));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<TransactionResponse> withdraw(Authentication auth, @Valid @RequestBody MoneyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.withdraw(auth.getName(), req));
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(Authentication auth, @Valid @RequestBody TransferRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.transfer(auth.getName(), req));
    }

    @GetMapping
    public PageResponse<TransactionResponse> history(
            Authentication auth,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.history(auth.getName(), type, from, to, q, page, size);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            Authentication auth,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q) {
        String csv = service.exportCsv(auth.getName(), type, from, to, q);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transactions.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
