// @ts-nocheck
"use client";

import { AUDIENCE_COHORTS } from "@/lib/audience-cohorts";

export const AgeCohortGrid = ({
  selectedId,
  onSelect,
  variant = "light",
  sectionLabel = "Demographic trends",
}) => {
  return (
    <div className={"cohort-picker cohort-picker--" + variant}>
      {sectionLabel ? (
        <div className="cohort-picker-label">{sectionLabel}</div>
      ) : null}
      <div className="cohort-grid" role="listbox" aria-label="Age group">
        {AUDIENCE_COHORTS.map((c) => {
          const sel = selectedId === c.id;
          const interactive = !!onSelect;
          const Tag = interactive ? "button" : "div";
          return (
            <Tag
              key={c.id}
              type={interactive ? "button" : undefined}
              role={interactive ? "option" : undefined}
              aria-selected={interactive ? sel : undefined}
              className={"cohort-card " + (sel ? "sel" : "") + (interactive ? "" : " cohort-card--static")}
              onClick={interactive ? () => onSelect(c.id) : undefined}
            >
              <div className="cohort-card-top">
                <span className="cohort-card-icon" aria-hidden>{c.icon}</span>
                <span className="cohort-card-badge">Demographic</span>
              </div>
              <h4 className="cohort-card-title">{c.label}</h4>
              <p className="cohort-card-insight">{c.insight}</p>
              <div className="cohort-flavor-row">
                {c.flavors.map((f) => (
                  <span key={f} className="cohort-flavor-pill">{f}</span>
                ))}
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
};
