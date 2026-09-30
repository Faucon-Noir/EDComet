import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StatsPage from ".";

const { getLatestStats } = vi.hoisted(() => ({ getLatestStats: vi.fn() }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; date?: string }) =>
      options?.defaultValue ??
      `translated:${key}${options?.date ? ` ${options.date}` : ""}`,
    i18n: { language: "en" },
  }),
}));

vi.mock("../../utils/api", () => ({ statsApi: { getLatestStats } }));

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: ({
    series,
  }: {
    series: { data: { label: string; value: number }[] }[];
  }) => (
    <div data-testid="profits-chart">
      {series
        .flatMap((group) => group.data)
        .map((item) => (
          <span key={item.label}>
            {item.label}: {item.value}
          </span>
        ))}
    </div>
  ),
}));

describe("StatsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("displays the latest stats, profit shares and all available categories", async () => {
    getLatestStats.mockResolvedValue({
      data: {
        timestamp: "2026-09-26T12:00:00Z",
        event: "Statistics",
        Bank_Account: {
          Current_Wealth: 1200000,
          Spent_On_Ships: 400,
          Spent_On_Outfitting: 100,
          Spent_On_Fuel: 50,
        },
        Combat: { Bounty_Hunting_Profit: 200 },
        Trading: { Market_Profits: 300, Markets_Traded_With: 4 },
        Mining: { Mining_Profit: 0 },
        Exploration: { Systems_Visited: 12, Total_Hyperspace_Jumps: 27 },
        Exobiology: { First_Logged: 7 },
      },
    });

    render(<StatsPage />);

    expect(screen.getByLabelText("translated:loading")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("1,200,000 Cr")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("translated:categories.Combat: 200"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("translated:categories.Trading: 300"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("translated:spendingGroups.ships: 500"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("translated:spendingItems.fuel: 50"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("translated:categories.Mining: 0"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Exobiology"));
    expect(screen.getByText("First Logged")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Bank Account")).toBeInTheDocument();
  });

  it("shows an empty state when no stats event exists", async () => {
    getLatestStats.mockResolvedValue({ data: null });
    render(<StatsPage />);
    expect(
      await screen.findByText("translated:emptyState"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("profits-chart")).not.toBeInTheDocument();
  });

  it("shows an error when the request fails", async () => {
    getLatestStats.mockRejectedValue(new Error("offline"));
    render(<StatsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "translated:error",
    );
  });
});
