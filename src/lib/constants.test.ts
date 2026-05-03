import { describe, it, expect } from "vitest";
import { getBidIncrement } from "./constants";

describe("getBidIncrement", () => {
  it("uses €1 increment under €20", () => {
    expect(getBidIncrement(0)).toBe(100);
    expect(getBidIncrement(100)).toBe(100);
    expect(getBidIncrement(1999)).toBe(100);
  });

  it("uses €2 increment between €20 and €100", () => {
    expect(getBidIncrement(2000)).toBe(200);
    expect(getBidIncrement(5000)).toBe(200);
    expect(getBidIncrement(9999)).toBe(200);
  });

  it("uses 5% increment between €100 and €500", () => {
    expect(getBidIncrement(10000)).toBe(500);
    expect(getBidIncrement(20000)).toBe(1000);
    expect(getBidIncrement(49999)).toBe(2500);
  });

  it("uses 5% increment with €25 minimum at €500 and above", () => {
    expect(getBidIncrement(50000)).toBe(2500);
    expect(getBidIncrement(60000)).toBe(3000);
    expect(getBidIncrement(500000)).toBe(25000);
  });
});
