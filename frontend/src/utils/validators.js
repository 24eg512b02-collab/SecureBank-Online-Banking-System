// Mirrors the backend Bean Validation rules in Dtos.java
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/;
export const PASSWORD_MSG =
  'Use 8-64 characters with upper and lower case letters, a digit and a special character';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(f) {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Enter your full name';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!/^\d{10}$/.test(f.mobile)) e.mobile = 'Mobile number must be 10 digits';
  if (!f.dateOfBirth) e.dateOfBirth = 'Select your date of birth';
  else {
    const dob = new Date(f.dateOfBirth);
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - 18);
    if (dob > limit) e.dateOfBirth = 'You must be at least 18 years old';
  }
  if (!f.address.trim()) e.address = 'Enter your address';
  if (!PASSWORD_RE.test(f.password)) e.password = PASSWORD_MSG;
  if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match';
  return e;
}

export function validateAmount(v) {
  if (v === '' || v == null) return 'Enter an amount';
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(String(v))) return 'Enter a valid amount (max 2 decimal places)';
  const n = Number(v);
  if (n < 0.01) return 'Amount must be at least 0.01';
  if (n > 10000000) return 'Amount exceeds the per-transaction limit of 1,00,00,000';
  return '';
}

export const isEmail = (v) => EMAIL_RE.test(v.trim());
