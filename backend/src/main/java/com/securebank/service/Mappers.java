package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.Account;
import com.securebank.entity.Direction;
import com.securebank.entity.Transaction;
import com.securebank.entity.User;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

final class Mappers {
    private Mappers() {}

    static TransactionResponse tx(Transaction t) {
        return new TransactionResponse(t.getTransactionId(), t.getAccount().getAccountNumber(),
                t.getType().name(), t.getDirection().name(), t.getAmount(), t.getBalanceAfter(),
                t.getCounterpartyAccount(), t.getDescription(), t.getStatus(), t.getCreatedAt());
    }

    static CustomerRow customer(User u) {
        Account a = u.getAccount();
        return new CustomerRow(u.getId(), u.getFullName(), u.getEmail(), u.getMobile(),
                a == null ? null : a.getAccountNumber(),
                a == null ? null : a.getAccountType().name(),
                a == null ? BigDecimal.ZERO : a.getBalance(),
                a == null ? null : a.getStatus().name(),
                u.isEnabled(), u.getCreatedAt());
    }

    static <T, R> PageResponse<R> page(Page<T> p, Function<T, R> fn) {
        return new PageResponse<>(p.getContent().stream().map(fn).collect(Collectors.toList()),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    /** Masks a holder name for display to other customers, e.g. "Alice Smith" -> "A*** S***". */
    static String maskName(String name) {
        return Arrays.stream(name.trim().split("\\s+"))
                .filter(w -> !w.isEmpty())
                .map(w -> w.charAt(0) + "***")
                .collect(Collectors.joining(" "));
    }

    static BigDecimal orZero(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    /** Last 6 calendar months (oldest first). CREDIT rows count as income, DEBIT rows as spending. */
    static List<MonthlyPoint> monthly(Collection<Transaction> rows) {
        YearMonth current = YearMonth.now();
        Map<YearMonth, BigDecimal[]> buckets = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            buckets.put(current.minusMonths(i), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        for (Transaction t : rows) {
            BigDecimal[] b = buckets.get(YearMonth.from(t.getCreatedAt()));
            if (b == null) continue;
            if (t.getDirection() == Direction.CREDIT) b[0] = b[0].add(t.getAmount());
            else b[1] = b[1].add(t.getAmount());
        }
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
        List<MonthlyPoint> out = new ArrayList<>();
        buckets.forEach((ym, v) -> out.add(new MonthlyPoint(ym.format(fmt), v[0], v[1])));
        return out;
    }

    static LocalDate sixMonthsAgoStart() {
        return YearMonth.now().minusMonths(5).atDay(1);
    }
}
