import React from "react";

export function DistrictNodalOfficersStatsSection({
  totalCount,
  activeCount,
  inactiveCount,
}) {
  return (
    <div className="stats-grid">
      <div className="stat-card stat-card-blue">
        <div>
          <p className="stat-label stat-label-blue">Total Officers</p>
          <p className="stat-value stat-value-blue">{totalCount}</p>
        </div>
        <div className="stat-icon stat-icon-blue">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
      </div>

      <div className="stat-card stat-card-green">
        <div>
          <p className="stat-label stat-label-green">Active Officers</p>
          <p className="stat-value stat-value-green">{activeCount}</p>
        </div>
        <div className="stat-icon stat-icon-green">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="stat-card stat-card-red">
        <div>
          <p className="stat-label stat-label-red">Inactive Officers</p>
          <p className="stat-value stat-value-red">{inactiveCount}</p>
        </div>
        <div className="stat-icon stat-icon-red">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
