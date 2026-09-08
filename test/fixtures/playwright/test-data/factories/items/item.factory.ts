import type { TestInfo } from "@playwright/test";

export function generateItemName(testInfo: TestInfo, label: string): string {
  return `${label}-${testInfo.workerIndex}-${testInfo.repeatEachIndex}`;
}
