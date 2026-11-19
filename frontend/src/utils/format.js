export const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n || 0));

export const dateTime = (s) =>
  s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export const dateOnly = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '-';

export const groupAcc = (n) => (n ? String(n).replace(/(\d{4})(?=\d)/g, '$1 ') : '-');

export const TYPE_LABEL = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  TRANSFER_IN: 'Transfer received',
  TRANSFER_OUT: 'Transfer sent',
};
