import { parseSchedule } from "./schedule-parser";

describe("parseSchedule", () => {
  describe("minute intervals", () => {
    it("parses 'every 5 minutes'", () => {
      expect(parseSchedule("every 5 minutes")).toBe("*/5 * * * *");
    });

    it("parses 'every 1 minute'", () => {
      expect(parseSchedule("every 1 minute")).toBe("*/1 * * * *");
    });

    it("throws for out-of-range minute interval", () => {
      expect(() => parseSchedule("every 60 minutes")).toThrow();
    });
  });

  describe("hour intervals", () => {
    it("parses 'every hour'", () => {
      expect(parseSchedule("every hour")).toBe("0 * * * *");
    });

    it("parses 'every 2 hours'", () => {
      expect(parseSchedule("every 2 hours")).toBe("0 */2 * * *");
    });

    it("throws for out-of-range hour interval", () => {
      expect(() => parseSchedule("every 24 hours")).toThrow();
    });
  });

  describe("daily schedules", () => {
    it("parses 'every day at 9am'", () => {
      expect(parseSchedule("every day at 9am")).toBe("0 9 * * *");
    });

    it("parses 'every day at noon'", () => {
      expect(parseSchedule("every day at noon")).toBe("0 12 * * *");
    });

    it("parses 'every day at 8:30'", () => {
      expect(parseSchedule("every day at 8:30")).toBe("30 8 * * *");
    });

    it("parses 'every day at midnight'", () => {
      expect(parseSchedule("every day at midnight")).toBe("0 0 * * *");
    });
  });

  describe("weekday schedules", () => {
    it("parses 'every weekday at 9am'", () => {
      expect(parseSchedule("every weekday at 9am")).toBe("0 9 * * 1-5");
    });
  });

  describe("named day schedules", () => {
    it("parses 'every monday at 8:30am'", () => {
      expect(parseSchedule("every monday at 8:30am")).toBe("0 8 * * 1");
    });

    it("parses 'every friday at 6pm'", () => {
      expect(parseSchedule("every friday at 6pm")).toBe("0 18 * * 5");
    });

    it("throws for unknown day name", () => {
      expect(() => parseSchedule("every funday at 9am")).toThrow();
    });
  });

  describe("invalid expressions", () => {
    it("throws for completely unrecognized expression", () => {
      expect(() => parseSchedule("run at some point")).toThrow();
    });

    it("throws for invalid time format", () => {
      expect(() => parseSchedule("every day at 25:00")).toThrow();
    });
  });
});
