import * as OPA from "../../../base/src";
import * as TestConfig from "../TestConfiguration.test";

/* eslint-disable brace-style, camelcase */

const config = TestConfig.getTestConfiguration();

describe("Contact Tests using Firebase " + config.testEnvironment, function() {
  if (!OPA.isNullish(config.timeout)) {
    this.timeout(OPA.convertNonNullish(config.timeout)); // eslint-disable-line no-invalid-this
  }
});
