-- SecureBank (ACADEMIC DEMO - simulated funds only) - MySQL 8 schema
CREATE DATABASE IF NOT EXISTS securebank CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE securebank;

CREATE TABLE IF NOT EXISTS roles (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  mobile        VARCHAR(15)  NOT NULL,
  date_of_birth DATE         NOT NULL,
  address       VARCHAR(255) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,          -- BCrypt hash, never plain text
  enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME(6)  NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id INT    NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accounts (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_number VARCHAR(12)  NOT NULL UNIQUE,
  account_type   VARCHAR(20)  NOT NULL,          -- SAVINGS | CURRENT
  balance        DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  status         VARCHAR(20)  NOT NULL,          -- ACTIVE | INACTIVE
  user_id        BIGINT       NOT NULL UNIQUE,
  created_at     DATETIME(6)  NOT NULL,
  CONSTRAINT chk_balance_non_negative CHECK (balance >= 0),   -- DB-level guard: no negative balances
  CONSTRAINT fk_acc_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  transaction_id       VARCHAR(40)  NOT NULL UNIQUE,
  idempotency_key      VARCHAR(64)  NULL,        -- duplicate-submission protection
  account_id           BIGINT       NOT NULL,
  type                 VARCHAR(20)  NOT NULL,    -- DEPOSIT | WITHDRAWAL | TRANSFER_IN | TRANSFER_OUT
  direction            VARCHAR(10)  NOT NULL,    -- CREDIT | DEBIT
  amount               DECIMAL(19,2) NOT NULL,
  balance_after        DECIMAL(19,2) NOT NULL,
  counterparty_account VARCHAR(12)  NULL,
  description          VARCHAR(255) NULL,
  status               VARCHAR(20)  NOT NULL,
  created_at           DATETIME(6)  NOT NULL,
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT uk_account_idem UNIQUE (account_id, idempotency_key),
  CONSTRAINT fk_tx_account FOREIGN KEY (account_id) REFERENCES accounts(id),
  INDEX idx_tx_account_created (account_id, created_at),
  INDEX idx_tx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS beneficiaries (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT       NOT NULL,
  account_number VARCHAR(12)  NOT NULL,
  holder_name    VARCHAR(120) NOT NULL,          -- masked at save time
  nickname       VARCHAR(60)  NULL,
  created_at     DATETIME(6)  NOT NULL,
  CONSTRAINT uk_user_benef UNIQUE (user_id, account_number),
  CONSTRAINT fk_benef_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN');
-- Demo users (alice/bob/admin) are created by the backend DataSeeder with BCrypt hashes
-- when securebank.seed-demo-data=true. No passwords are stored in this script.
