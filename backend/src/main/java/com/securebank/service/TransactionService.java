package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.*;
import com.securebank.exception.ApiException;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.TransactionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * All money movement lives here. Every operation is one database transaction that:
 *  1. takes pessimistic row locks (SELECT ... FOR UPDATE) on the accounts involved, in ascending id order,
 *  2. checks idempotency key, account status and balance AFTER the lock is held,
 *  3. updates balances and writes ledger rows, committing or rolling back as a unit.
 * ALL FUNDS ARE SIMULATED.
 */
@Service
public class TransactionService {
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

    private final AccountRepository accounts;
    private final TransactionRepository txs;

    public TransactionService(AccountRepository accounts, TransactionRepository txs) {
        this.accounts = accounts;
        this.txs = txs;
    }

    // ---------------------------------------------------------------- deposit
    @Transactional
    public TransactionResponse deposit(String email, MoneyRequest req) {
        Account acc = lockOwn(email);
        Optional<Transaction> dup = duplicate(acc, req.idempotencyKey());
        if (dup.isPresent()) return Mappers.tx(dup.get());
        requireActive(acc, "Your account is not active");

        BigDecimal amount = scale(req.amount());
        acc.setBalance(acc.getBalance().add(amount));
        Transaction t = record(acc, TransactionType.DEPOSIT, Direction.CREDIT, amount, null,
                describe(req.description(), "Cash deposit (simulated)"), req.idempotencyKey(), newId());
        return Mappers.tx(t);
    }

    // --------------------------------------------------------------- withdraw
    @Transactional
    public TransactionResponse withdraw(String email, MoneyRequest req) {
        Account acc = lockOwn(email);
        Optional<Transaction> dup = duplicate(acc, req.idempotencyKey());
        if (dup.isPresent()) return Mappers.tx(dup.get());
        requireActive(acc, "Your account is not active");

        BigDecimal amount = scale(req.amount());
        if (acc.getBalance().compareTo(amount) < 0) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Insufficient balance");
        }
        acc.setBalance(acc.getBalance().subtract(amount));
        Transaction t = record(acc, TransactionType.WITHDRAWAL, Direction.DEBIT, amount, null,
                describe(req.description(), "Cash withdrawal (simulated)"), req.idempotencyKey(), newId());
        return Mappers.tx(t);
    }

    // --------------------------------------------------------------- transfer
    @Transactional
    public TransactionResponse transfer(String email, TransferRequest req) {
        Long senderId = accounts.findIdByUserEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        Long receiverId = accounts.findIdByAccountNumber(req.toAccountNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Beneficiary account not found"));
        if (senderId.equals(receiverId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot transfer money to your own account");
        }

        Map<Long, Account> locked = accounts.lockAll(List.of(senderId, receiverId)).stream()
                .collect(Collectors.toMap(Account::getId, a -> a));
        Account from = locked.get(senderId);
        Account to = locked.get(receiverId);
        if (from == null || to == null) throw new ApiException(HttpStatus.NOT_FOUND, "Account not found");

        Optional<Transaction> dup = duplicate(from, req.idempotencyKey());
        if (dup.isPresent()) return Mappers.tx(dup.get());

        requireActive(from, "Your account is not active");
        requireActive(to, "Beneficiary account is not active");

        BigDecimal amount = scale(req.amount());
        if (from.getBalance().compareTo(amount) < 0) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Insufficient balance");
        }
        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        String ref = newId();
        String desc = describe(req.description(), "Fund transfer");
        Transaction debit = record(from, TransactionType.TRANSFER_OUT, Direction.DEBIT, amount,
                to.getAccountNumber(), desc, req.idempotencyKey(), ref);
        record(to, TransactionType.TRANSFER_IN, Direction.CREDIT, amount,
                from.getAccountNumber(), desc, null, ref + "C");
        return Mappers.tx(debit);
    }

    // ---------------------------------------------------------------- history
    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> history(String email, TransactionType type, LocalDate from, LocalDate to,
                                                     String q, int page, int size) {
        Long accountId = accounts.findIdByUserEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), NEWEST_FIRST);
        return Mappers.page(txs.findAll(TransactionSpecs.filter(accountId, type, from, to, q), pr), Mappers::tx);
    }

    @Transactional(readOnly = true)
    public String exportCsv(String email, TransactionType type, LocalDate from, LocalDate to, String q) {
        Long accountId = accounts.findIdByUserEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        List<Transaction> rows = txs.findAll(TransactionSpecs.filter(accountId, type, from, to, q),
                PageRequest.of(0, 5000, NEWEST_FIRST)).getContent();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        StringBuilder sb = new StringBuilder("Transaction ID,Date,Type,Direction,Amount,Balance After,Counterparty,Description\n");
        for (Transaction t : rows) {
            sb.append(csv(t.getTransactionId())).append(',')
              .append(csv(t.getCreatedAt().format(fmt))).append(',')
              .append(csv(t.getType().name())).append(',')
              .append(csv(t.getDirection().name())).append(',')
              .append(t.getAmount().toPlainString()).append(',')
              .append(t.getBalanceAfter().toPlainString()).append(',')
              .append(csv(t.getCounterpartyAccount())).append(',')
              .append(csv(t.getDescription())).append('\n');
        }
        return sb.toString();
    }

    // -------------------------------------------------------------- dashboard
    @Transactional(readOnly = true)
    public DashboardResponse dashboard(String email) {
        Account acc = accounts.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        List<TransactionResponse> recent = txs.findAll(TransactionSpecs.filter(acc.getId(), null, null, null, null),
                PageRequest.of(0, 5, NEWEST_FIRST)).getContent().stream().map(Mappers::tx).toList();
        List<Transaction> sixMonths = txs.findByAccountIdAndCreatedAtGreaterThanEqual(
                acc.getId(), Mappers.sixMonthsAgoStart().atStartOfDay());
        return new DashboardResponse(acc.getUser().getFullName(), acc.getAccountNumber(), acc.getAccountType().name(),
                acc.getStatus().name(), acc.getBalance(),
                Mappers.orZero(txs.sumByAccountAndType(acc.getId(), TransactionType.DEPOSIT)),
                Mappers.orZero(txs.sumByAccountAndType(acc.getId(), TransactionType.WITHDRAWAL)),
                recent, Mappers.monthly(sixMonths));
    }

    // ---------------------------------------------------------------- helpers
    /** Resolve the id first (no entity cached), then lock, so the balance we read is always the committed one. */
    private Account lockOwn(String email) {
        Long id = accounts.findIdByUserEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        List<Account> locked = accounts.lockAll(List.of(id));
        if (locked.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Account not found");
        return locked.get(0);
    }

    private Optional<Transaction> duplicate(Account acc, String key) {
        if (key == null || key.isBlank()) return Optional.empty();
        return txs.findByAccountIdAndIdempotencyKey(acc.getId(), key);
    }

    private void requireActive(Account acc, String message) {
        if (acc.getStatus() != AccountStatus.ACTIVE) throw new ApiException(HttpStatus.FORBIDDEN, message);
    }

    private Transaction record(Account acc, TransactionType type, Direction dir, BigDecimal amount,
                               String counterparty, String description, String idemKey, String txId) {
        Transaction t = new Transaction();
        t.setTransactionId(txId);
        t.setIdempotencyKey(idemKey == null || idemKey.isBlank() ? null : idemKey);
        t.setAccount(acc);
        t.setType(type);
        t.setDirection(dir);
        t.setAmount(amount);
        t.setBalanceAfter(acc.getBalance());
        t.setCounterpartyAccount(counterparty);
        t.setDescription(description);
        t.setStatus("SUCCESS");
        return txs.save(t);
    }

    private static BigDecimal scale(BigDecimal v) { return v.setScale(2, RoundingMode.HALF_UP); }

    private static String newId() {
        return "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private static String describe(String given, String fallback) {
        return given == null || given.isBlank() ? fallback : given.trim();
    }

    /** RFC 4180 quoting plus a guard against spreadsheet formula injection. */
    private static String csv(String s) {
        if (s == null) return "\"\"";
        String v = s;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0) v = "'" + v;
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
