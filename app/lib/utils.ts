import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Determine label and color
  if (score <= 2) {
    return { score, label: "Weak", color: "text-red-500" };
  } else if (score <= 4) {
    return { score, label: "Fair", color: "text-yellow-500" };
  } else if (score <= 6) {
    return { score, label: "Good", color: "text-blue-500" };
  } else {
    return { score, label: "Strong", color: "text-green-500" };
  }
}

export function generatePassword(
  length: number = 16,
  includeSymbols: boolean = true
): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let chars = lowercase + uppercase + numbers;
  if (includeSymbols) {
    chars += symbols;
  }

  let password = "";

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
