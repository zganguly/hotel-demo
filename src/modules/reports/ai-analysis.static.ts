export type InsightTone = "positive" | "watch" | "critical" | "neutral";

export type InsightMetric = {
  label: string;
  value: string;
  change: string;
  tone: InsightTone;
  detail: string;
};

export type Prediction = {
  title: string;
  horizon: string;
  confidence: string;
  summary: string;
  impact: string;
  action: string;
  tone: InsightTone;
};

export type Recommendation = {
  priority: "High" | "Medium" | "Low";
  title: string;
  why: string;
  expectedLift: string;
  ownerFocus: string;
};

export type RiskItem = {
  area: string;
  severity: "Critical" | "Elevated" | "Monitor";
  signal: string;
  mitigation: string;
};

export const AI_ANALYSIS_STATIC = {
  generatedAt: "24 Jul 2026 · 17:40 IST",
  modelLabel: "Owner briefing · static demo",
  propertyFocus: "Harbour View Hotel (demo)",
  executiveBrief: {
    headline: "Demand strengthens next weekend — protect rate and readiness",
    summary:
      "AI review of occupancy, pace, channel mix, and operations suggests a strong Friday–Sunday window. Revenue opportunity is clear if you tighten BAR on peak nights, finish suite turnovers before noon, and shift more direct bookings away from high-commission OTAs.",
    confidence: "82% confidence on 7-day demand call",
    topActions: [
      "Raise Deluxe & Suite BAR +8–12% for Fri–Sat only",
      "Hold 6 Standard rooms for walk-in / direct until Thursday noon",
      "Prioritize suite housekeeping before 11:30 to avoid arrival friction",
    ],
  },
  scorecard: [
    {
      label: "7-day occupancy outlook",
      value: "86%",
      change: "+9 pts vs last week",
      tone: "positive",
      detail: "Weekend nights projected above 92%",
    },
    {
      label: "RevPAR forecast",
      value: "₹6,420",
      change: "+11% vs prior week",
      tone: "positive",
      detail: "Lift driven by rate mix, not only volume",
    },
    {
      label: "Direct booking share",
      value: "34%",
      change: "−4 pts vs target 38%",
      tone: "watch",
      detail: "OTA share still absorbing weekend demand",
    },
    {
      label: "Owner risk index",
      value: "Medium",
      change: "2 elevated signals",
      tone: "watch",
      detail: "Housekeeping lag + late deposit follow-up",
    },
  ] satisfies InsightMetric[],
  demandPredictions: [
    {
      title: "Weekend sell-out pressure",
      horizon: "Next 3–5 nights",
      confidence: "High · 88%",
      summary:
        "Friday and Saturday Standard inventory is likely to reach stop-sell if current pace continues. Suite demand is rising from corporate + leisure mix.",
      impact: "Potential ₹2.4L incremental room revenue if rates are defended early.",
      action: "Apply length-of-stay of 2 nights for Fri arrival; close discount codes after Wednesday.",
      tone: "positive",
    },
    {
      title: "Midweek soft patch",
      horizon: "Tue–Wed next week",
      confidence: "Medium · 71%",
      summary:
        "Corporate pickup is slower than seasonal baseline. Twin rooms show the widest gap versus pace last year.",
      impact: "≈12 unsold Twin nights unless activated by local / company outreach.",
      action: "Offer negotiated corporate flex rate only Tue–Wed; keep weekend BAR protected.",
      tone: "watch",
    },
    {
      title: "Festival lead-in surge",
      horizon: "14–21 days out",
      confidence: "Medium · 69%",
      summary:
        "Search interest and OTA look-to-book for the property city are climbing ahead of the regional festival calendar.",
      impact: "Early group and family packages can lock higher ADR before market fills.",
      action: "Publish a 2-night festival package with breakfast before channel managers copy competitors.",
      tone: "positive",
    },
  ] satisfies Prediction[],
  revenueInsights: [
    {
      priority: "High",
      title: "Reclaim weekend OTA dilution",
      why: "Booking.com + Expedia currently produce 41% of Fri–Sat room nights at ~18% effective commission drag.",
      expectedLift: "+₹1.1L–1.6L net / weekend",
      ownerFocus: "Push confirmation emails with “book direct next time” member rate.",
    },
    {
      priority: "High",
      title: "Suite upsell at check-in",
      why: "18% of Deluxe arrivals accept upsell historically when offered with late checkout.",
      expectedLift: "+₹45k / week ancillary + room",
      ownerFocus: "Script front desk upsell for 4–6 pm arrivals only.",
    },
    {
      priority: "Medium",
      title: "Breakfast attach rate",
      why: "Room-only bookings are 57% of direct stays; breakfast attach is only 22%.",
      expectedLift: "+₹28k F&B / week",
      ownerFocus: "Add breakfast toggle on booking engine confirmation step.",
    },
    {
      priority: "Medium",
      title: "Cancel / modify deposit policy",
      why: "No-show + late cancel cost ≈ ₹72k last 30 days on flexible rates.",
      expectedLift: "Protect ₹50k+ / month",
      ownerFocus: "Require deposit for arrivals inside 48 hours on BAR Flexible.",
    },
  ] satisfies Recommendation[],
  operationsInsights: [
    {
      title: "Housekeeping readiness gap",
      body: "Average suite turn time is 48 minutes vs 36-minute target. Peak arrival days show 3–5 guests waiting for inspected rooms after 14:00.",
      metric: "Suite turn 48 min",
      tone: "watch" as InsightTone,
    },
    {
      title: "Maintenance OOO impact",
      body: "Room 412 (Deluxe) has been OOO 6 of last 14 days. That alone removed ≈ ₹57k sellable revenue at current ADR.",
      metric: "1 room · 6 OOO nights",
      tone: "critical" as InsightTone,
    },
    {
      title: "Night audit blockers",
      body: "Two open cashier variances and one unsettled group master folio delayed business-date close twice this week.",
      metric: "2 delayed closes",
      tone: "watch" as InsightTone,
    },
    {
      title: "Staffing balance",
      body: "Saturday front-desk coverage is thin between 15:00–17:00 when arrivals + upsell opportunity peak.",
      metric: "1 cashier short Sat PM",
      tone: "watch" as InsightTone,
    },
  ],
  guestExperience: [
    {
      theme: "Arrival friction",
      signal: "Guests mentioning “room not ready” in reviews rose from 4% → 9% this month.",
      recommendation: "Publish real-time room-ready SMS once housekeeping marks Inspected.",
    },
    {
      theme: "Loyalty opportunity",
      signal: "Repeat guests are 19% of stays but produce 31% of room revenue.",
      recommendation: "Create a simple returning-guest rate and personal welcome note workflow.",
    },
    {
      theme: "Complaint recovery",
      signal: "AC / noise complaints close in 3.4 hours on average — good — but 22% lack follow-up note.",
      recommendation: "Require recovery note + goodwill gesture logging before ticket close.",
    },
    {
      theme: "F&B perception",
      signal: "Breakfast scores 4.6/5; dinner outlet under-indexes at 3.9/5 on weekends.",
      recommendation: "Pilot a fixed weekend thali / set menu to stabilize quality and ticket time.",
    },
  ],
  channelAndCompetition: [
    {
      channel: "Direct website",
      share: "34%",
      trend: "Flat",
      note: "Needs weekend member rate visibility above the fold.",
    },
    {
      channel: "OTA aggregate",
      share: "41%",
      trend: "Up",
      note: "Winning volume but compressing net ADR after commission.",
    },
    {
      channel: "Corporate / company",
      share: "15%",
      trend: "Down",
      note: "Two accounts lapsed renewals; outreach recommended this week.",
    },
    {
      channel: "Walk-in / phone",
      share: "10%",
      trend: "Stable",
      note: "Useful for last-room premium — keep rate floor disciplined.",
    },
  ],
  financialPulse: [
    {
      label: "Gross room revenue (7d)",
      value: "₹48.6L",
      note: "On track vs budget +3%",
    },
    {
      label: "Net after channel cost",
      value: "₹41.9L",
      note: "Commission drag above target by ₹62k",
    },
    {
      label: "Ancillary / guest",
      value: "₹1,180",
      note: "Below peer set ₹1,450",
    },
    {
      label: "AR aging > 30 days",
      value: "₹3.2L",
      note: "3 corporate invoices need owner follow-up",
    },
  ],
  risks: [
    {
      area: "Inventory integrity",
      severity: "Elevated",
      signal: "Overbooking limit unused but OTA allotments still open while house is 94% committed Fri.",
      mitigation: "Set channel stop-sell for Standard on Fri once confirmed > 90%.",
    },
    {
      area: "Cash & deposits",
      severity: "Elevated",
      signal: "14 arrivals inside 48h still have zero deposit captured.",
      mitigation: "Run deposit chase list every morning before 10:00.",
    },
    {
      area: "Reputation",
      severity: "Monitor",
      signal: "Recent reviews cite slow Wi-Fi on floors 3–4.",
      mitigation: "Schedule ISP / AP check before festival week.",
    },
    {
      area: "Compliance",
      severity: "Monitor",
      signal: "Guest ID capture incomplete on 2 walk-ins last week.",
      mitigation: "Block check-in completion until ID fields validated.",
    },
  ] satisfies RiskItem[],
  ownerPlaybook: [
    {
      when: "Today",
      items: [
        "Approve weekend BAR increase recommendation for Deluxe & Suite",
        "Review OOO room 412 status with engineering",
        "Clear AR invoices older than 30 days (top 3 accounts)",
      ],
    },
    {
      when: "This week",
      items: [
        "Launch direct-member weekend rate on booking engine",
        "Add Saturday 15:00–17:00 front-desk coverage",
        "Train team on Deluxe → Suite upsell script",
      ],
    },
    {
      when: "Next 30 days",
      items: [
        "Renew two lapsed corporate accounts",
        "Publish festival package and protect inventory allotment",
        "Review Wi-Fi quality on floors 3–4 before peak season",
      ],
    },
  ],
} as const;
