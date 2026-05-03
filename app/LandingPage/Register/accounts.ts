'use client';

type AccountType = 'student' | 'schoolRep';

export type Account = {
  password: string;
  route: string;
  type: AccountType;
  fullName?: string;
  email?: string;
};

const STORAGE_KEY = 'collappAccounts';

const defaultAccounts: Record<string, Account> = {
  school1: {
    password: '12345',
    route: '/schoolrep',
    type: 'schoolRep',
    fullName: 'Demo School Rep',
    email: 'rep@example.com',
  },
};

function isAccountValue(value: unknown): value is Account {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Account).password === 'string' &&
    typeof (value as Account).route === 'string' &&
    ((value as Account).type === 'student' || (value as Account).type === 'schoolRep')
  );
}

export function loadAccounts(): Record<string, Account> {
  if (typeof window === 'undefined') {
    return defaultAccounts;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccounts));
    return { ...defaultAccounts };
  }

  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid account store');
    }

    const merged: Record<string, Account> = { ...defaultAccounts };
    for (const key of Object.keys(parsed)) {
      const value = (parsed as Record<string, unknown>)[key];
      if (isAccountValue(value)) {
        merged[key] = value;
      }
    }

    if (!('school1' in parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }

    return merged;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccounts));
    return { ...defaultAccounts };
  }
}

export function saveAccounts(accounts: Record<string, Account>) {
  if (typeof window === 'undefined') {
    return;
  }

  const merged = { ...defaultAccounts, ...accounts };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function deleteAccount(username: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || normalizedUsername === 'school1') {
    return false;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return false;
  }

  try {
    const parsed = JSON.parse(stored) as Record<string, Account>;
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }

    const existing = parsed[normalizedUsername];
    if (!existing || existing.type !== 'student') {
      return false;
    }

    const updatedAccounts: Record<string, Account> = { ...parsed };
    delete updatedAccounts[normalizedUsername];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
    return true;
  } catch {
    return false;
  }
}
