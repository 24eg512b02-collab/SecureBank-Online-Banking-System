package com.securebank.controller;

import com.securebank.dto.Dtos.*;
import com.securebank.service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {
    private final BeneficiaryService service;

    public BeneficiaryController(BeneficiaryService service) { this.service = service; }

    @GetMapping
    public List<BeneficiaryResponse> list(Authentication auth) { return service.list(auth.getName()); }

    @PostMapping
    public ResponseEntity<BeneficiaryResponse> add(Authentication auth, @Valid @RequestBody BeneficiaryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.add(auth.getName(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        service.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
