import React from "react";
import { Tabs, Tab } from "@mui/material";

export function DashboardTabs({ tabs, value, onChange }) {
  return (
    <div className="ado-tabbar" role="navigation" aria-label="Dashboard sections">
      <Tabs
        value={value}
        onChange={(_, next) => onChange(next)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        className="ado-tabs"
        TabIndicatorProps={{ className: "ado-tabs-indicator" }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            id={`ado-tab-${tab.id}`}
            aria-controls={`ado-tabpanel-${tab.id}`}
            className="ado-tab"
            disableRipple
            label={
              <span className="ado-tab-label">
                {tab.label}
                {tab.badge != null && <span className="ado-tab-badge">{tab.badge}</span>}
              </span>
            }
          />
        ))}
      </Tabs>
    </div>
  );
}
