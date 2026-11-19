package com.securebank.config;

import com.securebank.dto.Dtos.MoneyRequest;
import com.securebank.dto.Dtos.RegisterRequest;
import com.securebank.entity.AccountType;
import com.securebank.entity.User;
import com.securebank.repository.UserRepository;
import com.securebank.service.AuthService;
import com.securebank.service.TransactionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * LOCAL DEVELOPMENT ONLY. Creates demo logins with BCrypt-hashed passwords and simulated opening balances.
 * Disable with securebank.seed-demo-data=false (or SEED_DEMO_DATA=false).
 */
@Component
@ConditionalOnProperty(name = "securebank.seed-demo-data", havingValue = "true")
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final AuthService auth;
    private final TransactionService transactions;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, AuthService auth, TransactionService transactions, PasswordEncoder encoder) {
        this.users = users;
        this.auth = auth;
        this.transactions = transactions;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!users.existsByEmailIgnoreCase("admin@securebank.local")) {
            User admin = new User();
            admin.setFullName("Demo Administrator");
            admin.setEmail("admin@securebank.local");
            admin.setMobile("9000000000");
            admin.setDateOfBirth(LocalDate.of(1990, 1, 1));
            admin.setAddress("SecureBank HQ (demo)");
            admin.setPasswordHash(encoder.encode("Admin@12345"));
            admin.getRoles().add(auth.role("ROLE_ADMIN"));
            users.save(admin);
        }
        seedCustomer("Alice Sharma", "alice@example.com", "9876543210", LocalDate.of(1995, 5, 15),
                "12 Demo Street, Hyderabad", AccountType.SAVINGS, "25000.00");
        seedCustomer("Bob Verma", "bob@example.com", "9123456780", LocalDate.of(1992, 9, 3),
                "34 Sample Road, Hyderabad", AccountType.CURRENT, "10000.00");
        log.warn("Demo data seeded (LOCAL DEV ONLY): admin@securebank.local / alice@example.com / bob@example.com");
    }

    private void seedCustomer(String name, String email, String mobile, LocalDate dob, String address,
                              AccountType type, String opening) {
        if (users.existsByEmailIgnoreCase(email)) return;
        String pwd = "Password@123";
        auth.register(new RegisterRequest(name, email, mobile, dob, address, pwd, pwd, type));
        transactions.deposit(email, new MoneyRequest(new BigDecimal(opening),
                "Opening balance (simulated funds)", null));
    }
}
