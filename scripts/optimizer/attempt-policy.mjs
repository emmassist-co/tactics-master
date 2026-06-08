import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const policy = JSON.parse(readFileSync(path.join(__dirname, "attempt-policy.json"), "utf8"));

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function matchesPrefix(filePath, rule) {
  const normalizedPath = normalizePath(filePath);
  const normalizedRule = normalizePath(rule);
  return normalizedPath === normalizedRule || normalizedPath.startsWith(normalizedRule);
}

export function loadAttemptPolicy() {
  return policy;
}

export function isProtectedPath(filePath, activePolicy = policy) {
  return activePolicy.protectedPrefixes.some((rule) => matchesPrefix(filePath, rule));
}

export function isMutablePath(filePath, activePolicy = policy) {
  const normalizedPath = normalizePath(filePath);
  if (isProtectedPath(normalizedPath, activePolicy)) return false;
  if (activePolicy.mutableFiles.includes(normalizedPath)) return true;
  return activePolicy.mutablePrefixes.some((rule) => matchesPrefix(normalizedPath, rule));
}

export function validateAttemptFiles(changedFiles, activePolicy = policy) {
  const normalized = changedFiles.map(normalizePath);
  const invalidFiles = normalized.filter((filePath) => !isMutablePath(filePath, activePolicy));
  return {
    valid: invalidFiles.length === 0,
    changedFiles: normalized,
    invalidFiles,
  };
}
