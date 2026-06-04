#!/usr/bin/env python3
"""Import national 2x2 / flavor card data from BGPT.xlsx (ignores 'For Sid' sheet)."""
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
XLSX = Path.home() / "Downloads" / "BGPT.xlsx"


def fmt_pct(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        p = v * 100 if abs(v) <= 1 else v
        return f"{p:.1f}%"
    s = str(v).strip()
    if s.endswith("%"):
        return s
    try:
        f = float(s)
        return f"{f * 100:.1f}%" if f <= 1 else f"{f:.1f}%"
    except ValueError:
        return s


def int_idx(v):
    if v is None:
        return None
    return int(round(float(v)))


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Data Feeding into 2x2 & Cards"]
    flavors = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        name = row[0]
        if not name or str(name).strip() == "Flavor":
            continue
        name = str(name).strip()
        item = {
            "name": name,
            "convVolume": str(row[1]).strip() if row[1] else None,
            "engVolume": str(row[2]).strip() if row[2] else None,
            "convGrowth": fmt_pct(row[3]),
            "engGrowth": fmt_pct(row[4]),
            "diyIndex": int_idx(row[5]),
            "shareabilityIndex": int_idx(row[6]),
            "cravingIndex": int_idx(row[7]),
            "comfortIndex": int_idx(row[8]),
            "curiosityIndex": int_idx(row[9]),
            "giftingIndex": int_idx(row[10]),
            "whyPopular": str(row[11]).strip() if row[11] else None,
            "states": str(row[12]).strip() if row[12] else None,
            "whenTrends": str(row[13]).strip() if row[13] else None,
            "trendType": str(row[14]).strip() if row[14] else None,
            "extensions": str(row[15]).strip() if row[15] else None,
            "brandFit": str(row[16]).strip() if row[16] else None,
        }
        if row[17] is not None:
            try:
                item["fitmentScore"] = round(float(row[17]), 1)
            except (TypeError, ValueError):
                pass
        if row[18]:
            item["brandFitReasoning"] = str(row[18]).strip()
        flavors.append(item)

    (ROOT / "lib/demo-national-parsed.json").write_text(
        json.dumps(flavors, indent=2) + "\n", encoding="utf-8"
    )

    ws_ins = wb["Key Insights (Select Flavors)"]
    insights = {}
    for row in ws_ins.iter_rows(min_row=2, values_only=True):
        if row[0] and row[1]:
            insights[str(row[0]).strip()] = str(row[1]).strip()
    (ROOT / "lib/demo-flavor-key-insights.json").write_text(
        json.dumps(insights, indent=2) + "\n", encoding="utf-8"
    )

    ws_def = wb["Variable Definitions"]
    definitions = {}
    for row in ws_def.iter_rows(min_row=2, values_only=True):
        if row[0] and row[1]:
            definitions[str(row[0]).strip()] = str(row[1]).strip()
    (ROOT / "lib/demo-flavor-index-definitions.json").write_text(
        json.dumps(definitions, indent=2) + "\n", encoding="utf-8"
    )

    print(f"Wrote {len(flavors)} flavors → lib/demo-national-parsed.json")
    print(f"Wrote {len(insights)} key insights → lib/demo-flavor-key-insights.json")
    print(f"Wrote {len(definitions)} index definitions → lib/demo-flavor-index-definitions.json")


if __name__ == "__main__":
    main()
