import { expect, mergeTests } from '@playwright/test';
import { test as helperFixture } from '../helper/helper-fixture';
import { test as pageObjectFixture } from './page-object-fixture';

const test = mergeTests(pageObjectFixture, helperFixture);

export { expect, test };
