import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Auto re-spawn with TypeScript type-stripping if run via plain `node scripts/...`
if (!process.execArgv.includes("--experimental-strip-types")) {
  const result = spawnSync(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-strip-types",
      "--loader",
      "./scripts/loader.mjs",
      fileURLToPath(import.meta.url),
      ...process.argv.slice(2),
    ],
    { stdio: "inherit" }
  );
  process.exit(result.status ?? 0);
}

console.log("=== STARTING UNIT TESTS: CALENDAR WEEK & CONTENT PLANNER CONTRACTS ===");

// Dynamic imports to allow re-spawn logic before loading .ts modules
const {
  getCalendarWeekNumber,
  getDaysInWeek,
  getCalendarWeeksForMonth,
  formatDayOfWeek,
  formatDateToYYYYMMDD,
} = await import("../lib/utils/calendar-week.ts");

const {
  DEFAULT_CONTENT_PLANS,
  PLATFORM_OPTIONS,
  TIPE_KONTEN_OPTIONS,
  KONSEP_OPTIONS,
  OBJEKTIF_OPTIONS,
  STATUS_OPTIONS,
  TIPE_KONTEN_STYLES,
  KONSEP_STYLES,
  OBJEKTIF_STYLES,
  STATUS_STYLES,
} = await import("../lib/types/content-planner.ts");

// --------------------------------------------------------------------------
// TEST 1: Calendar Week Calculation (getCalendarWeekNumber)
// --------------------------------------------------------------------------
console.log("\n[TEST 1] Testing getCalendarWeekNumber (Sunday-based CW calculation)...");

// CW 22: 26 May 2024 (Sunday) to 01 June 2024 (Saturday)
assert.equal(getCalendarWeekNumber("2024-05-26"), 22, "2024-05-26 (Sunday) must be CW 22");
assert.equal(getCalendarWeekNumber("2024-05-27"), 22, "2024-05-27 (Monday) must be CW 22");
assert.equal(getCalendarWeekNumber("2024-05-28"), 22, "2024-05-28 (Tuesday) must be CW 22");
assert.equal(getCalendarWeekNumber("2024-05-29"), 22, "2024-05-29 (Wednesday) must be CW 22");
assert.equal(getCalendarWeekNumber("2024-05-30"), 22, "2024-05-30 (Thursday) must be CW 22");
assert.equal(getCalendarWeekNumber("2024-05-31"), 22, "2024-05-31 (Friday) must be CW 22");
assert.equal(getCalendarWeekNumber("2024-06-01"), 22, "2024-06-01 (Saturday) must be CW 22");

// Verify Date object input
assert.equal(getCalendarWeekNumber(new Date(2024, 4, 26)), 22, "Date(2024, 4, 26) must be CW 22");
assert.equal(getCalendarWeekNumber(new Date(2024, 5, 1)), 22, "Date(2024, 5, 1) must be CW 22");

// CW 23: 02 June 2024 (Sunday) to 08 June 2024 (Saturday)
assert.equal(getCalendarWeekNumber("2024-06-02"), 23, "2024-06-02 (Sunday) must be CW 23");
assert.equal(getCalendarWeekNumber("2024-06-03"), 23, "2024-06-03 (Monday) must be CW 23");
assert.equal(getCalendarWeekNumber("2024-06-08"), 23, "2024-06-08 (Saturday) must be CW 23");

// Early January check: 2024-01-01 (Monday) is CW 1, 2024-01-07 (Sunday) is CW 2
assert.equal(getCalendarWeekNumber("2024-01-01"), 1, "2024-01-01 must be CW 1");
assert.equal(getCalendarWeekNumber("2024-01-07"), 2, "2024-01-07 must be CW 2");

console.log("  ✓ getCalendarWeekNumber passed all CW 22, CW 23, and boundary assertions");

// --------------------------------------------------------------------------
// TEST 2: Days in Week Generation (getDaysInWeek)
// --------------------------------------------------------------------------
console.log("\n[TEST 2] Testing getDaysInWeek (7-day Sunday-to-Saturday array)...");

const cw22Days = getDaysInWeek(2024, 22);
assert.equal(cw22Days.length, 7, "CW 22 must have exactly 7 days");
assert.equal(formatDateToYYYYMMDD(cw22Days[0]), "2024-05-26", "CW 22 Day 0 must be 2024-05-26 (Sunday)");
assert.equal(cw22Days[0].getDay(), 0, "CW 22 Day 0 must be Sunday (getDay() === 0)");
assert.equal(formatDateToYYYYMMDD(cw22Days[6]), "2024-06-01", "CW 22 Day 6 must be 2024-06-01 (Saturday)");
assert.equal(cw22Days[6].getDay(), 6, "CW 22 Day 6 must be Saturday (getDay() === 6)");

const cw23Days = getDaysInWeek(2024, 23);
assert.equal(cw23Days.length, 7, "CW 23 must have exactly 7 days");
assert.equal(formatDateToYYYYMMDD(cw23Days[0]), "2024-06-02", "CW 23 Day 0 must be 2024-06-02 (Sunday)");
assert.equal(formatDateToYYYYMMDD(cw23Days[6]), "2024-06-08", "CW 23 Day 6 must be 2024-06-08 (Saturday)");

console.log("  ✓ getDaysInWeek passed all 7-day structure and boundary date assertions");

// --------------------------------------------------------------------------
// TEST 3: Calendar Weeks in a Month (getCalendarWeeksForMonth)
// --------------------------------------------------------------------------
console.log("\n[TEST 3] Testing getCalendarWeeksForMonth...");

// June 2024 (month index 5): June 1 is Saturday in CW 22, June 30 is Sunday in CW 27
const juneWeeks = getCalendarWeeksForMonth(2024, 5);
assert.deepEqual(
  juneWeeks,
  [22, 23, 24, 25, 26, 27],
  "June 2024 must span CW 22 through CW 27"
);

// May 2024 (month index 4): May 1 is CW 18, May 31 is CW 22
const mayWeeks = getCalendarWeeksForMonth(2024, 4);
assert(mayWeeks.includes(22), "May 2024 must also include CW 22");
assert.equal(mayWeeks[0], 18, "May 2024 first week must be CW 18");
assert.equal(mayWeeks[mayWeeks.length - 1], 22, "May 2024 last week must be CW 22");

console.log("  ✓ getCalendarWeeksForMonth passed all month boundary assertions");

// --------------------------------------------------------------------------
// TEST 4: Date Formatting Utilities (formatDayOfWeek & formatDateToYYYYMMDD)
// --------------------------------------------------------------------------
console.log("\n[TEST 4] Testing formatDayOfWeek & formatDateToYYYYMMDD...");

const formattedSunday = formatDayOfWeek("2024-05-26");
assert.equal(formattedSunday.dayName, "Sunday", "Day name must be 'Sunday'");
assert.equal(formattedSunday.dayNumber, 26, "Day number must be 26");
assert.equal(formattedSunday.fullDate, "2024-05-26", "Full date must be '2024-05-26'");

const formattedSaturday = formatDayOfWeek(new Date(2024, 5, 1));
assert.equal(formattedSaturday.dayName, "Saturday", "Day name must be 'Saturday'");
assert.equal(formattedSaturday.dayNumber, 1, "Day number must be 1");
assert.equal(formattedSaturday.fullDate, "2024-06-01", "Full date must be '2024-06-01'");

assert.equal(formatDateToYYYYMMDD(new Date(2024, 4, 26)), "2024-05-26");
assert.equal(formatDateToYYYYMMDD(new Date(2024, 5, 8)), "2024-06-08");

console.log("  ✓ Formatting utilities passed all assertions");

// --------------------------------------------------------------------------
// TEST 5: Type Contracts, Options & Styles Verification
// --------------------------------------------------------------------------
console.log("\n[TEST 5] Testing Options Lists & Style Definitions...");

assert(PLATFORM_OPTIONS.includes("TikTok"), "PLATFORM_OPTIONS must contain 'TikTok'");
assert(PLATFORM_OPTIONS.includes("Instagram"), "PLATFORM_OPTIONS must contain 'Instagram'");
assert(PLATFORM_OPTIONS.includes("YouTube"), "PLATFORM_OPTIONS must contain 'YouTube'");
assert(PLATFORM_OPTIONS.includes("LinkedIn"), "PLATFORM_OPTIONS must contain 'LinkedIn'");
assert(PLATFORM_OPTIONS.includes("Web"), "PLATFORM_OPTIONS must contain 'Web'");

for (const tipe of TIPE_KONTEN_OPTIONS) {
  assert(TIPE_KONTEN_STYLES[tipe], `TIPE_KONTEN_STYLES must have entry for '${tipe}'`);
  assert(typeof TIPE_KONTEN_STYLES[tipe].bg === "string", `Style for '${tipe}' must define bg`);
}

for (const konsep of KONSEP_OPTIONS) {
  assert(KONSEP_STYLES[konsep], `KONSEP_STYLES must have entry for '${konsep}'`);
}

for (const obj of OBJEKTIF_OPTIONS) {
  assert(OBJEKTIF_STYLES[obj], `OBJEKTIF_STYLES must have entry for '${obj}'`);
}

for (const status of STATUS_OPTIONS) {
  assert(STATUS_STYLES[status], `STATUS_STYLES must have entry for '${status}'`);
}

console.log("  ✓ Options and style maps verified successfully");

// --------------------------------------------------------------------------
// TEST 6: Initial Seed Data Verification (14 items from Mockup CW 22 & CW 23)
// --------------------------------------------------------------------------
console.log("\n[TEST 6] Testing DEFAULT_CONTENT_PLANS seed data...");

assert.equal(DEFAULT_CONTENT_PLANS.length, 14, "DEFAULT_CONTENT_PLANS must contain exactly 14 items");

const cw22Items = DEFAULT_CONTENT_PLANS.filter((item) => item.calendar_week === 22);
assert.equal(cw22Items.length, 7, "CW 22 must contain 7 seed items");

const cw23Items = DEFAULT_CONTENT_PLANS.filter((item) => item.calendar_week === 23);
assert.equal(cw23Items.length, 7, "CW 23 must contain 7 seed items");

// Validate field completeness for all seed items
for (const item of DEFAULT_CONTENT_PLANS) {
  assert(item.id, "Seed item must have id");
  assert(item.tanggal, "Seed item must have tanggal");
  assert(typeof item.calendar_week === "number", "Seed item must have calendar_week number");
  assert(item.day_of_week, "Seed item must have day_of_week");
  assert.equal(item.platform, "TikTok", "Mockup seed items must be platform 'TikTok'");
  assert(item.tipe_konten, "Seed item must have tipe_konten");
  assert(item.topik, "Seed item must have topik");
  assert(item.konsep, "Seed item must have konsep");
  assert(item.objektif, "Seed item must have objektif");
  assert(item.status, "Seed item must have status");
  assert(typeof item.progress === "number" && item.progress >= 0 && item.progress <= 100, "Progress must be 0-100");
  assert(typeof item.is_done === "boolean", "is_done must be boolean");

  if (item.is_done) {
    assert.equal(item.progress, 100, "Items marked done must have progress 100");
    assert.equal(item.status, "Published", "Items marked done must have status Published");
  }
}

console.log("  ✓ DEFAULT_CONTENT_PLANS contains 14 fully valid seed items");

console.log("\n========================================================");
console.log(" ALL UNIT TESTS PASSED SUCCESSFULLY! (100% Assertion Pass)");
console.log("========================================================\n");
