import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CircularProgress from "@mui/material/CircularProgress";
import { PieChart } from "@mui/x-charts/PieChart";
import * as statsStyles from "./style";
import { useStats } from "./hook";

const StatsPage: React.FC = () => {
  const {
    t,
    language,
    stats,
    loading,
    error,
    formatNumber,
    profits,
    totalProfits,
    spendingGroups,
    spendingItems,
    totalSpent,
    label,
  } = useStats();

  return (
    <Box sx={statsStyles.page}>
      <Typography variant="h4" component="h1" sx={statsStyles.title}>
        {t("title")}
      </Typography>
      {loading && (
        <Box sx={statsStyles.loading}>
          <CircularProgress aria-label={t("loading")} />
        </Box>
      )}
      {!loading && error && (
        <Typography role="alert" sx={statsStyles.status}>
          {t("error")}
        </Typography>
      )}
      {!loading && !error && !stats && (
        <Typography sx={statsStyles.status}>{t("emptyState")}</Typography>
      )}
      {!loading && !error && stats && (
        <>
          <Typography color="text.secondary" sx={statsStyles.updated}>
            {t("updated", {
              date: new Intl.DateTimeFormat(language, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(stats.timestamp)),
            })}
          </Typography>
          <Box sx={statsStyles.metrics}>
            {[
              {
                name: t("wealth"),
                value: stats.Bank_Account?.Current_Wealth,
                unit: " Cr",
              },
              { name: t("systems"), value: stats.Exploration?.Systems_Visited },
              {
                name: t("jumps"),
                value: stats.Exploration?.Total_Hyperspace_Jumps,
              },
              { name: t("trades"), value: stats.Trading?.Markets_Traded_With },
            ].map(({ name, value, unit }) => (
              <Box key={name} sx={statsStyles.metric}>
                <Typography variant="body2" color="text.secondary">
                  {name}
                </Typography>
                <Typography variant="h5" sx={statsStyles.metricValue}>
                  {value == null ? "-" : `${formatNumber(value)}${unit ?? ""}`}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box sx={statsStyles.charts}>
            <Box component="section" sx={statsStyles.chartSection}>
              <Typography variant="h6">{t("profits")}</Typography>
              {profits.length ? (
                <>
                  <Box sx={statsStyles.chart}>
                    <PieChart
                      height={300}
                      hideLegend
                      series={[
                        {
                          data: profits,
                          innerRadius: 80,
                          outerRadius: 120,
                          paddingAngle: 2,
                          arcLabelMinAngle: 15,
                          cornerRadius: 5,
                          arcLabel: (item) =>
                            `${Math.round((item.value / totalProfits) * 100)}%`,
                          valueFormatter: (item) =>
                            `${formatNumber(item.value)} Cr`,
                        },
                      ]}
                    />
                    <Box sx={statsStyles.chartCenter}>
                      <Typography variant="body2" color="text.secondary">
                        {t("totalProfits")}
                      </Typography>
                      <Typography variant="h6">
                        {formatNumber(totalProfits)} Cr
                      </Typography>
                    </Box>
                  </Box>
                  <Box component="ul" sx={statsStyles.legend}>
                    {profits.map((item) => (
                      <Box
                        component="li"
                        key={item.id}
                        sx={statsStyles.legendRow}
                      >
                        <Box sx={statsStyles.coloredLegendDot(item.color)} />
                        <Typography sx={statsStyles.legendLabel}>
                          {item.label}
                        </Typography>
                        <Typography sx={statsStyles.legendValue}>
                          {Math.round((item.value / totalProfits) * 100)}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography sx={statsStyles.chartEmpty}>
                  {t("noProfits")}
                </Typography>
              )}
            </Box>
            <Box component="section" sx={statsStyles.chartSection}>
              <Typography variant="h6">{t("spending")}</Typography>
              {spendingGroups.length ? (
                <>
                  <Box sx={statsStyles.chart}>
                    <PieChart
                      height={300}
                      hideLegend
                      series={[
                        {
                          data: spendingGroups.map((group) => ({
                            id: group.id,
                            label: group.label,
                            color: group.color,
                            value: group.items.reduce(
                              (sum, item) => sum + item.value,
                              0,
                            ),
                          })),
                          innerRadius: 50,
                          outerRadius: 91,
                          paddingAngle: 2,
                          cornerRadius: 5,
                          arcLabelMinAngle: 24,
                          arcLabel: (item) =>
                            `${Math.round((item.value / totalSpent) * 100)}%`,
                          valueFormatter: (item) =>
                            `${formatNumber(item.value)} Cr`,
                        },
                        {
                          data: spendingItems,
                          innerRadius: 99,
                          outerRadius: 132,
                          paddingAngle: 1,
                          cornerRadius: 5,
                          valueFormatter: (item) =>
                            `${formatNumber(item.value)} Cr`,
                        },
                      ]}
                    />
                    <Box sx={statsStyles.chartCenter}>
                      <Typography variant="body2">{t("totalSpent")}</Typography>
                    </Box>
                  </Box>
                  <Typography sx={statsStyles.spendingTotal}>
                    {formatNumber(totalSpent)} Cr
                  </Typography>
                  <Box component="ul" sx={statsStyles.legend}>
                    {spendingGroups.map((group) => (
                      <Box component="li" key={group.id}>
                        <Typography
                          sx={statsStyles.coloredSpendingGroup(group.color)}
                        >
                          {group.label}
                        </Typography>
                        {group.items.map((item) => (
                          <Box key={item.id} sx={statsStyles.spendingItem}>
                            <Box
                              component="span"
                              sx={statsStyles.coloredSpendingDot(item.color)}
                            />
                            <Typography
                              variant="body2"
                              sx={statsStyles.legendLabel}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={statsStyles.legendValue}
                            >
                              {Math.round((item.value / totalSpent) * 100)}%
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography sx={statsStyles.chartEmpty}>
                  {t("noSpending")}
                </Typography>
              )}
            </Box>
          </Box>
          <Typography variant="h6" sx={statsStyles.detailsTitle}>
            {t("details")}
          </Typography>
          {Object.entries(stats)
            .filter(
              ([key, value]) =>
                key !== "event" &&
                key !== "timestamp" &&
                value &&
                typeof value === "object",
            )
            .map(([key, values]) => (
              <Accordion key={key} disableGutters sx={statsStyles.accordion}>
                <AccordionSummary
                  expandIcon={
                    <Box component="span" sx={statsStyles.accordionExpand}>
                      {">"}
                    </Box>
                  }
                >
                  <Typography>
                    {t(`categories.${key}`, { defaultValue: label(key) })}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={statsStyles.accordionDetails}>
                  {Object.entries(values as Record<string, unknown>)
                    .filter(([, value]) => value != null)
                    .map(([field, value]) => (
                      <Box key={field} sx={statsStyles.detail}>
                        <Typography variant="body2" color="text.secondary">
                          {label(field)}
                        </Typography>
                        <Typography sx={statsStyles.metricValue}>
                          {typeof value === "number"
                            ? formatNumber(value)
                            : String(value)}
                        </Typography>
                      </Box>
                    ))}
                </AccordionDetails>
              </Accordion>
            ))}
        </>
      )}
    </Box>
  );
};

export default StatsPage;
