package com.securebank.repository;

import com.securebank.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUserEmailIgnoreCase(String email);
    Optional<Account> findByAccountNumber(String accountNumber);
    boolean existsByAccountNumber(String accountNumber);

    /** Id-only lookups so the entity is NOT loaded (and cached) before the row lock is taken. */
    @Query("select a.id from Account a where a.user.email = :email")
    Optional<Long> findIdByUserEmail(@Param("email") String email);

    @Query("select a.id from Account a where a.accountNumber = :number")
    Optional<Long> findIdByAccountNumber(@Param("number") String number);

    /** SELECT ... FOR UPDATE, always in ascending id order to avoid deadlocks between opposite transfers. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id in :ids order by a.id")
    List<Account> lockAll(@Param("ids") Collection<Long> ids);

    @Query("select sum(a.balance) from Account a")
    BigDecimal sumBalances();
}
