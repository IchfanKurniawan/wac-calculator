# Carbon Intelligence: Comprehensive Design System & Strategic Framework

## 1. Vision & Strategy: "The Environmental Architect"
**Core Objective:** To bridge the gap between complex environmental data and actionable architectural insights. The design must feel as precise as an engineering tool but as legible and elegant as a premium editorial journal.

**Design Pillars:**
*   **Precision:** Data must be the hero. Accurate alignment, clear units, and high-contrast visualizations.
*   **Transparency:** Every calculation and recommendation should feel grounded in verifiable standards (e.g., GGP Protocol, ISO 14064).
*   **Vibrancy:** Sustainability is a living goal. Use "Mint Glow" to highlight progress, growth, and positive action.

---

## 2. Visual Foundation

### Typography: The "Inter" Framework
*   **Primary Typeface:** Inter (Variable)
*   **Scale & Hierarchy:**
    *   **Display Large:** 48px, Bold, -0.02em tracking. Used for primary dashboard metrics.
    *   **Headline MD:** 24px, Semi-Bold. Used for section titles and card headers.
    *   **Body LG:** 16px, Regular. Primary reading text for reports.
    *   **Label SM:** 12px, Medium, All-Caps, 0.05em tracking. Used for metadata and sidebar navigation.
*   **Tabular Numbers:** Enabled for all data tables to ensure vertical decimal alignment.

### Color Palette: "Veridian Metric"
| Color Name | Hex Code | Role |
| :--- | :--- | :--- |
| **Mint Glow** | `#D3FEAB` | Primary Action, Progress Bars, Success States. |
| **Deep Teal** | `#1B4E4D` | Primary Foundation, Sidebars, Brand Identity. |
| **Jet Gray** | `#272727` | Deep Backgrounds, High-Contrast Text. |
| **Amber Orange**| `#FF9500` | Warnings, Medium-Impact Alerts, In-Progress States. |
| **Slate 50/100** | `#F8FAFC` | Page backgrounds and subtle card borders. |

---

## 3. Core Component Library

### Navigation Systems
*   **SideNavBar (The Rail):** A persistent `Deep Teal` sidebar. Uses `Inter Label-MD` for navigation items. Icons are Material Symbols (Outlined). Includes a "New Calculation" primary CTA.
*   **TopNavBar (The Utility Bar):** A light, translucent bar (`bg-white/80 backdrop-blur`) for global search, notifications, and user profiles.

### Data Visualization Standards
*   **Progress Rings:** Large-scale circular gauges for primary "Emissions" metrics. Uses `Deep Teal` for the background track and `Mint Glow` for the active value.
*   **Stacked Bar Charts:** Used for "Emissions by Category" to show Direct vs. Indirect splits.
*   **Intensity Trajectories:** Area charts with spline smoothing to show long-term carbon reduction trends.

### Functional Cards
*   **Summary Cards:** Large metric, percentage change pill, and a descriptive label.
*   **Project Cards:** Detailed rows containing Project Name, Status (Pill), Total CO2e, and a "View Report" action.
*   **Recommendation Cards:** Categorized by impact level (Critical/Strategic/Material) using color-coded headers.

---

## 4. UX Principles & Interaction Design

1.  **Stepped Disclosure:** In the **Carbon Calculator**, information is broken into logical phases (Materiality -> Energy -> Transport) to avoid user overwhelm.
2.  **Immediate Feedback:** As inputs change in the calculator, the "Real-Time Estimate" ring updates dynamically.
3.  **Actionable Intelligence:** Data is never presented without a "Next Step" or "Mitigation Recommendation."
4.  **Density Management:** High-density tables use zebra-striping or 1px dividers to maintain horizontal tracking across wide screens.

---

## 5. Implementation & Specs
*   **Grid System:** 12-column responsive grid with 32px gutters.
*   **Corner Radius:** `ROUND_EIGHT` (8px) applied to all cards, buttons, and input fields.
*   **Borders:** 1px solid `Slate 200` for light mode; 1px solid `Teal 800` for dark-themed elements.
*   **Transitions:** 200ms `ease-in-out` for all hover states and navigation transitions.
*   **Iconography:** Material Symbols (Outlined), consistent 24px optical size.

---

## 6. Accessibility & Compliance
*   **Contrast:** All text on "Mint Glow" backgrounds must use "Deep Teal" or "Black" to ensure WCAG AA compliance.
*   **Focus States:** 2px solid `Mint Glow` offset ring for keyboard navigation.
*   **Alt Text:** All visualizations must have screen-reader accessible descriptions of the data trends they represent.