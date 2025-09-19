import React from "react";
import PropTypes from "prop-types";

// /workspaces/Nexus-Inventory/nexus/components/OverviewCards.js


/**
 * OverviewCards
 *
 * A small, self-contained responsive card grid for displaying numeric metrics.
 * - Accepts an array of card objects via `cards` prop.
 * - Each card: { id, title, value, delta, color, onClick, description }
 *
 * Usage:
 * <OverviewCards
 *   cards={[
 *     { id: 'total', title: 'Total Items', value: 1234, delta: +12, color: '#0b74de' },
 *     { id: 'active', title: 'Active', value: 1100, delta: -3, color: '#16a34a' },
 *   ]}
 * />
 */

const containerStyle = {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    alignItems: "stretch",
    width: "100%",
};

const cardStyle = {
    background: "#fff",
    borderRadius: 8,
    padding: "12px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 88,
    cursor: "default",
};

const titleStyle = {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    fontWeight: 600,
};

const valueRowStyle = {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
};

const valueStyle = {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
};

const deltaStyle = (positive) => ({
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    color: positive ? "#065f46" : "#7f1d1d",
    background: positive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
    border: `1px solid ${positive ? "rgba(16,185,129,0.16)" : "rgba(239,68,68,0.12)"}`,
});

const descriptionStyle = {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
};

export default function OverviewCards({ cards = [] }) {
    if (!Array.isArray(cards) || cards.length === 0) {
        // default placeholder cards if none provided
        cards = [
            { id: "total", title: "Total Items", value: 0, delta: 0, color: "#0b74de" },
            { id: "active", title: "Active", value: 0, delta: 0, color: "#16a34a" },
            { id: "offline", title: "Offline", value: 0, delta: 0, color: "#f97316" },
            { id: "errors", title: "Errors", value: 0, delta: 0, color: "#ef4444" },
        ];
    }

    return (
        <div style={containerStyle} role="list" aria-label="Overview metrics">
            {cards.map((c) => {
                const deltaNumber = Number(c.delta) || 0;
                const positive = deltaNumber > 0;
                const deltaSign = deltaNumber > 0 ? `+${deltaNumber}` : `${deltaNumber}`;
                return (
                    <div
                        key={c.id}
                        role="listitem"
                        tabIndex={c.onClick ? 0 : -1}
                        onClick={c.onClick}
                        onKeyDown={(e) => {
                            if (c.onClick && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                c.onClick();
                            }
                        }}
                        style={{
                            ...cardStyle,
                            borderLeft: `4px solid ${c.color || "transparent"}`,
                            cursor: c.onClick ? "pointer" : "default",
                        }}
                        aria-label={`${c.title}: ${c.value}`}
                    >
                        <div>
                            <div style={titleStyle}>{c.title}</div>
                            <div style={valueRowStyle}>
                                <div style={valueStyle}>{c.value ?? "-"}</div>
                                <div style={deltaStyle(positive)} aria-hidden>
                                    {deltaNumber === 0 ? "—" : deltaSign}
                                </div>
                            </div>
                            {c.description ? <div style={descriptionStyle}>{c.description}</div> : null}
                        </div>
                        {c.footer ? <div style={{ marginTop: 10 }}>{c.footer}</div> : null}
                    </div>
                );
            })}
        </div>
    );
}

OverviewCards.propTypes = {
    cards: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string.isRequired,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            delta: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            color: PropTypes.string,
            description: PropTypes.string,
            footer: PropTypes.node,
            onClick: PropTypes.func,
        })
    ),
};