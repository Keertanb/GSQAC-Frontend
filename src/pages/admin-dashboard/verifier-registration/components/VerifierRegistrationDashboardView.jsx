import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import AppButton from "../../../../components/AppButton/AppButton";
import "./VerifierRegistrationDashboardView.css";

const CHART_COLORS = [
  "#2563eb",
  "#0f766e",
  "#b45309",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#059669",
  "#ea580c",
  "#4f46e5",
  "#64748b",
];

function StatCard({ label, value, sub, tone = "blue" }) {
  return (
    <div className={`vrda-stat vrda-stat--${tone}`}>
      <p className="vrda-stat__label">{label}</p>
      <p className="vrda-stat__value">{value ?? 0}</p>
      {sub ? <p className="vrda-stat__sub">{sub}</p> : null}
    </div>
  );
}

function Panel({ title, subtitle, children, wide }) {
  return (
    <section className={`vrda-panel${wide ? " vrda-panel--wide" : ""}`}>
      <header className="vrda-panel__head">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <div className="vrda-panel__body">{children}</div>
    </section>
  );
}

function EmptyChart({ message = "No data yet" }) {
  return <div className="vrda-empty">{message}</div>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vrda-tooltip">
      <strong>{label || payload[0]?.payload?.name}</strong>
      <span>{payload[0]?.value} applicants</span>
    </div>
  );
}

function HorizontalBars({ data, maxItems = 8 }) {
  const slice = (data || []).slice(0, maxItems);
  if (!slice.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, slice.length * 36)}>
      <BarChart
        data={slice}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function VerticalBars({ data, color = "#0f766e" }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10 }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }) {
  const filtered = (data || []).filter((item) => item.count > 0);
  if (!filtered.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {filtered.map((entry, index) => (
            <Cell
              key={entry.key || entry.name}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function InsightCard({ title, name, count, tone }) {
  return (
    <div className={`vrda-insight vrda-insight--${tone}`}>
      <p className="vrda-insight__title">{title}</p>
      <p className="vrda-insight__name">{name || "—"}</p>
      <p className="vrda-insight__count">
        {count != null ? `${count} preference${count === 1 ? "" : "s"}` : "No data"}
      </p>
    </div>
  );
}

export function VerifierRegistrationDashboardView({
  analytics,
  isLoading,
  isError,
  refetch,
}) {
  if (isLoading) {
    return (
      <div className="vrda-state">
        <div className="vrda-spinner" aria-hidden />
        <p>Loading registration analytics…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="vrda-state">
        <p>Failed to load registration analytics.</p>
        <AppButton variant="blue" size="sm" onClick={() => refetch()}>
          Retry
        </AppButton>
      </div>
    );
  }

  const a = analytics;
  const topDistricts = a.districtInterest.slice(0, 10);
  const schoolLevelShort = a.schoolLevel.map((item) => ({
    ...item,
    name:
      item.key === "higher_education"
        ? "Higher Education"
        : item.key === "primary"
          ? "Primary"
          : item.key === "secondary"
            ? "Secondary"
            : item.key === "other"
              ? "Other"
              : item.name,
  }));

  return (
    <div className="vrda">
      <div className="vrda-intro">
        <div>
          <p className="vrda-eyebrow">Live overview</p>
          <h2 className="vrda-title">Registration Insights</h2>
          <p className="vrda-desc">
            District interest, school levels, qualifications, and other form
            metrics from verifier applications.
          </p>
        </div>
        <div className="vrda-intro__meta">
          <span className="vrda-pill">{a.total} total applicants</span>
          <span className="vrda-pill vrda-pill--soft">
            Avg experience {a.avgExperienceYears} yrs
          </span>
        </div>
      </div>

      <div className="vrda-stat-grid">
        <StatCard
          label="Total Registrations"
          value={a.cards.total}
          sub="All submitted applications"
          tone="blue"
        />
        <StatCard
          label="Employed"
          value={a.cards.employed}
          sub={`${a.percents.employed}% of applicants`}
          tone="teal"
        />
        <StatCard
          label="Retired (Nivruti)"
          value={a.cards.nivruti}
          sub="Occupation = નિવૃત્તિ"
          tone="amber"
        />
        <StatCard
          label="Ph.D Holders"
          value={a.cards.phdCount}
          sub={`${a.percents.phd}% selected Ph.D`}
          tone="violet"
        />
        <StatCard
          label="Post-Graduates"
          value={a.cards.postgraduateCount}
          sub={`${a.percents.postgraduate}% educational level`}
          tone="indigo"
        />
        <StatCard
          label="Computer / IT Yes"
          value={a.cards.computerYes}
          sub={`${a.percents.computer}% of applicants`}
          tone="green"
        />
        <StatCard
          label="Prior Accreditation"
          value={a.cards.previousAccreditationYes}
          sub={`${a.percents.previousAccreditation}% with experience`}
          tone="rose"
        />
        <StatCard
          label="Districts Interested"
          value={a.cards.districtsWithInterest}
          sub="Unique preferred districts"
          tone="slate"
        />
      </div>

      <div className="vrda-insight-row">
        <InsightCard
          title="Highest district interest"
          name={a.insights.highestInterest?.name}
          count={a.insights.highestInterest?.count}
          tone="high"
        />
        <InsightCard
          title="Lowest district interest"
          name={a.insights.lowestInterest?.name}
          count={a.insights.lowestInterest?.count}
          tone="low"
        />
        <InsightCard
          title="Top 1st-choice district"
          name={a.insights.topFirstChoice?.name}
          count={a.insights.topFirstChoice?.count}
          tone="first"
        />
      </div>

      <div className="vrda-grid">
        <Panel
          title="District interest"
          subtitle="Counts across preferred districts 1–3"
          wide
        >
          <HorizontalBars data={topDistricts} maxItems={12} />
        </Panel>

        <Panel
          title="School level / કક્ષા"
          subtitle="Primary · Secondary · Higher Education · Other"
        >
          <Donut data={schoolLevelShort} />
        </Panel>

        <Panel title="Educational qualification">
          <VerticalBars data={a.education} color="#7c3aed" />
        </Panel>

        <Panel
          title="Professional qualifications"
          subtitle="Includes Ph.D, M.Ed, B.Ed and others"
          wide
        >
          <HorizontalBars data={a.professional} maxItems={10} />
        </Panel>

        <Panel title="Occupation">
          <Donut data={a.occupation} />
        </Panel>

        <Panel title="Organization type">
          <VerticalBars data={a.organizationType} color="#b45309" />
        </Panel>

        <Panel title="Gender">
          <Donut data={a.gender} />
        </Panel>

        <Panel title="Years of experience">
          <VerticalBars data={a.experience} color="#059669" />
        </Panel>

        <Panel title="Work duration availability">
          <VerticalBars data={a.workDuration} color="#0891b2" />
        </Panel>

        <Panel title="Computer / IT knowledge">
          <Donut data={a.yesNo.computerKnowledge} />
        </Panel>

        <Panel title="Prior accreditation work">
          <Donut data={a.yesNo.previousAccreditation} />
        </Panel>

        <Panel title="Other verification experience">
          <Donut data={a.yesNo.otherVerification} />
        </Panel>

        <Panel title="Special educational achievement">
          <Donut data={a.yesNo.specialAchievement} />
        </Panel>

        <Panel title="Has vehicle">
          <Donut data={a.yesNo.hasVehicle} />
        </Panel>

        <Panel title="Vehicle type (among those with vehicle)">
          <Donut data={a.vehicleType} />
        </Panel>

        <Panel
          title="Native district"
          subtitle="Applicants by native district"
          wide
        >
          <HorizontalBars data={a.nativeDistrict} maxItems={12} />
        </Panel>
      </div>
    </div>
  );
}
