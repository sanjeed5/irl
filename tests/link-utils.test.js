const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizePlatformValue,
  validatePlatformUrl,
  getDisplayValue,
} = require("../link-utils.js");

test("normalizes X handles into HTTPS profile links", () => {
  assert.equal(normalizePlatformValue("x", "@sanjeed5"), "https://x.com/sanjeed5");
});

test("normalizes LinkedIn slugs into HTTPS profile links", () => {
  assert.equal(
    normalizePlatformValue("linkedin", "mohammed-sanjeed"),
    "https://www.linkedin.com/in/mohammed-sanjeed",
  );
});

test("adds HTTPS to website URLs without a scheme", () => {
  assert.equal(
    normalizePlatformValue("website", "sanjeed.in"),
    "https://sanjeed.in",
  );
});

test("rejects a non-X domain in the X field", () => {
  const result = validatePlatformUrl("x", "https://example.com/sanjeed");
  assert.equal(result.valid, false);
  assert.match(result.message, /X handle/);
});

test("rejects script URLs", () => {
  const result = validatePlatformUrl("website", "javascript:alert(1)");
  assert.equal(result.valid, false);
});

test("creates compact display labels", () => {
  assert.equal(getDisplayValue("x", "https://x.com/sanjeed5"), "@sanjeed5");
  assert.equal(
    getDisplayValue("linkedin", "https://www.linkedin.com/in/mohammed-sanjeed"),
    "mohammed-sanjeed",
  );
  assert.equal(getDisplayValue("website", "https://www.sanjeed.in/about"), "sanjeed.in");
});
