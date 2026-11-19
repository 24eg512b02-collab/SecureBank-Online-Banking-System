package com.securebank.repository;

import com.securebank.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Query("select count(u) from User u join u.roles r where r.name = 'ROLE_USER'")
    long countCustomers();

    @Query("select u from User u join u.roles r where r.name = 'ROLE_USER' and ("
            + "lower(u.fullName) like lower(concat('%', :q, '%')) "
            + "or lower(u.email) like lower(concat('%', :q, '%')) "
            + "or u.mobile like concat('%', :q, '%') "
            + "or exists (select 1 from Account a where a.user = u and a.accountNumber like concat('%', :q, '%')))")
    Page<User> searchCustomers(@Param("q") String q, Pageable pageable);
}
