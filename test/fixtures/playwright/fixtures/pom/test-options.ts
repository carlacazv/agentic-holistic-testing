import { expect, mergeTests } from "@playwright/test";
import { test as apiFixture } from "../api/api-fixture";
import { test as pageObjectFixture } from "./page-object-fixture";

const test = mergeTests(apiFixture, pageObjectFixture);

export { expect, test };
