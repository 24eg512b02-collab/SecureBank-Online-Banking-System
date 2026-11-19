package com.securebank.repository;

import com.securebank.entity.Transaction;
import com.securebank.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    Optional<Transaction> findByAccountIdAndIdempotencyKey(Long accountId, String idempotencyKey);

    List<Transaction> findByAccountIdAndCreatedAtGreaterThanEqual(Long accountId, LocalDateTime since);

    List<Transaction> findByCreatedAtGreaterThanEqual(LocalDateTime since);

    @Query("select sum(t.amount) from Transaction t where t.account.id = :accountId and t.type = :type")
    BigDecimal sumByAccountAndType(@Param("accountId") Long accountId, @Param("type") TransactionType type);

    @Query("select sum(t.amount) from Transaction t where t.type = :type")
    BigDecimal sumByType(@Param("type") TransactionType type);
}
