import { describe, expect, it } from "vitest";
import {
  getStockStatus,
  mapCategoryLabel,
  mapExitTypeLabel,
  mapOrderTypeLabel,
  mapStockStatusLabel,
  STOCK_THRESHOLDS,
} from "../uis/backoffice/lib/inventory-mappers";

describe("inventory mappers", () => {
  it("maps category values to display labels", () => {
    expect(mapCategoryLabel("training_kit")).toBe("Training kit");
    expect(mapCategoryLabel("certification")).toBe("Certification");
    expect(mapCategoryLabel("onboarding_equipment")).toBe("Onboarding equipment");
  });

  it("maps order and exit type labels", () => {
    expect(mapOrderTypeLabel("inbound")).toBe("Inbound");
    expect(mapOrderTypeLabel("outbound")).toBe("Outbound");
    expect(mapExitTypeLabel("allocation")).toBe("Allocation");
    expect(mapExitTypeLabel("consumption")).toBe("Consumption");
  });

  it("classifies stock using documented thresholds", () => {
    expect(STOCK_THRESHOLDS.critical).toBe(0);
    expect(STOCK_THRESHOLDS.lowMax).toBe(5);
    expect(getStockStatus(0)).toBe("critical");
    expect(getStockStatus(3)).toBe("low");
    expect(getStockStatus(6)).toBe("ok");
  });

  it("maps stock status to user-facing labels", () => {
    expect(mapStockStatusLabel("critical")).toBe("Out of stock");
    expect(mapStockStatusLabel("low")).toBe("Low stock");
    expect(mapStockStatusLabel("ok")).toBe("In stock");
  });
});
