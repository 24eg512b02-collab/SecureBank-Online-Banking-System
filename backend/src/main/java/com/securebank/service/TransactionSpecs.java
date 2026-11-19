package com.securebank.service;

import com.securebank.entity.Transaction;
import com.securebank.entity.TransactionType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

final class TransactionSpecs {
    private TransactionSpecs() {}

    /** Every filter is optional; accountId == null means "all accounts" (admin only). */
    static Specification<Transaction> filter(Long accountId, TransactionType type, LocalDate from, LocalDate to, String q) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (accountId != null) p.add(cb.equal(root.get("account").get("id"), accountId));
            if (type != null) p.add(cb.equal(root.get("type"), type));
            if (from != null) p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null) p.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase().replace("%", "").replace("_", "") + "%";
                p.add(cb.or(
                        cb.like(cb.lower(root.get("transactionId")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(root.get("counterpartyAccount"), like),
                        cb.like(root.get("account").get("accountNumber"), like)));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
