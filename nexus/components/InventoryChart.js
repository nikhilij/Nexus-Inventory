import React, { useRef, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";

/**
 * InventoryChart
 *
 * Simple, dependency-free SVG chart that supports "line" and "bar" visualizations.
 * Props:
 *  - data: [{ key: string|number, value: number }] (required)
 *  - width, height: numbers
 *  - type: "line" | "bar"
 *  - color: stroke/fill color
 *  - margin: { top, right, bottom, left }
 *  - showGrid: boolean
 *  - onPointClick: function(point)
 *
 * This file is intentionally self-contained to avoid external chart deps.
 */

function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(n);
}

export default function InventoryChart({
    data = [],
    width = 700,
    height = 240,
    type = "line",
    color = "#2563eb",
    margin = { top: 16, right: 20, bottom: 36, left: 48 },
    showGrid = true,
    onPointClick = null,
}) {
    const svgRef = useRef(null);
    const [hover, setHover] = useState(null);

    const innerWidth = Math.max(10, width - margin.left - margin.right);
    const innerHeight = Math.max(10, height - margin.top - margin.bottom);

    const processed = useMemo(() => {
        const points = Array.isArray(data)
            ? data.map((d, i) => {
                    const key = d.key != null ? d.key : i;
                    const value = typeof d.value === "number" ? d.value : Number(d.value) || 0;
                    return { key, value, raw: d };
                })
            : [];
        const values = points.map((p) => p.value);
        const min = points.length ? Math.min(...values, 0) : 0;
        const max = points.length ? Math.max(...values, 1) : 1;
        const span = max - min || 1;
        return { points, min, max, span };
    }, [data]);

    const xForIndex = useCallback(
        (i) => {
            if (!processed.points.length) return margin.left;
            if (type === "bar") {
                const barWidth = innerWidth / processed.points.length;
                return margin.left + i * barWidth + barWidth / 2;
            }
            return margin.left + (i / Math.max(1, processed.points.length - 1)) * innerWidth;
        },
        [processed.points.length, innerWidth, margin.left, type]
    );

    const yForValue = useCallback(
        (v) => {
            const ratio = (v - processed.min) / processed.span;
            // invert y (0 at top)
            return margin.top + innerHeight - ratio * innerHeight;
        },
        [processed.min, processed.span, margin.top, innerHeight]
    );

    // Build path for line
    const linePath = useMemo(() => {
        if (!processed.points.length || type !== "line") return "";
        return processed.points
            .map((p, i) => {
                const x = xForIndex(i);
                const y = yForValue(p.value);
                return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(" ");
    }, [processed.points, type, xForIndex, yForValue]);

    // grid ticks (nice)
    const ticks = useMemo(() => {
        const tickCount = 4;
        const result = [];
        for (let i = 0; i <= tickCount; i++) {
            const v = processed.min + (i / tickCount) * processed.span;
            result.push(v);
        }
        return result.reverse(); // top to bottom for rendering
    }, [processed.min, processed.span]);

    // hover detection
    function handleMouseMove(e) {
        const rect = svgRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        // find nearest point by x
        let nearest = null;
        let nearestDist = Infinity;
        processed.points.forEach((p, i) => {
            const x = xForIndex(i);
            const dist = Math.abs(mx - x);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = { point: p, index: i, x, y: yForValue(p.value) };
            }
        });
        setHover(nearest);
    }

    function handleMouseLeave() {
        setHover(null);
    }

    function handleClick() {
        if (hover && typeof onPointClick === "function") {
            onPointClick(hover.point.raw);
        }
    }

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            role="img"
            aria-label="Inventory chart"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{ display: "block", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}
        >
            {/* background */}
            <rect x="0" y="0" width={width} height={height} fill="transparent" />

            {/* grid lines and y labels */}
            <g>
                {ticks.map((t, i) => {
                    const y = yForValue(t);
                    return (
                        <g key={i}>
                            {showGrid && (
                                <line
                                    x1={margin.left}
                                    x2={width - margin.right}
                                    y1={y}
                                    y2={y}
                                    stroke="#e6e9ef"
                                    strokeWidth="1"
                                />
                            )}
                            <text x={margin.left - 8} y={y + 4} fontSize="12" fill="#374151" textAnchor="end">
                                {formatNumber(Math.round(t))}
                            </text>
                        </g>
                    );
                })}
            </g>

            {/* x labels */}
            <g>
                {processed.points.map((p, i) => {
                    const x = xForIndex(i);
                    const y = height - margin.bottom + 16;
                    // compress long labels
                    const label = String(p.key);
                    return (
                        <text key={i} x={x} y={y} fontSize="12" fill="#374151" textAnchor="middle">
                            {label.length > 12 ? label.slice(0, 11) + "…" : label}
                        </text>
                    );
                })}
            </g>

            {/* bars */}
            {type === "bar" && (
                <g>
                    {processed.points.map((p, i) => {
                        const barW = innerWidth / processed.points.length * 0.8;
                        const cx = xForIndex(i);
                        const x = cx - barW / 2;
                        const y = yForValue(Math.max(p.value, 0));
                        const h = margin.top + innerHeight - y;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width={barW}
                                height={h}
                                fill={color}
                                rx="3"
                                opacity={hover && hover.index === i ? 1 : 0.9}
                            />
                        );
                    })}
                </g>
            )}

            {/* line */}
            {type === "line" && (
                <g>
                    {/* filled area (subtle) */}
                    <path
                        d={
                            processed.points.length
                                ? `${linePath} L ${margin.left + innerWidth} ${margin.top + innerHeight} L ${margin.left} ${
                                        margin.top + innerHeight
                                    } Z`
                                : ""
                        }
                        fill={color}
                        opacity="0.06"
                    />
                    <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                </g>
            )}

            {/* points */}
            <g>
                {processed.points.map((p, i) => {
                    const x = xForIndex(i);
                    const y = yForValue(p.value);
                    const isHover = hover && hover.index === i;
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r={isHover ? 5.5 : 4} fill="#fff" stroke={color} strokeWidth={isHover ? 2 : 1.5} />
                        </g>
                    );
                })}
            </g>

            {/* hover tooltip */}
            {hover && (
                <g pointerEvents="none">
                    {/* vertical guide */}
                    <line
                        x1={hover.x}
                        x2={hover.x}
                        y1={margin.top}
                        y2={margin.top + innerHeight}
                        stroke="#cbd5e1"
                        strokeDasharray="4 6"
                    />
                    {/* tooltip box */}
                    <g transform={`translate(${Math.min(Math.max(hover.x + 8, margin.left + 8), width - margin.right - 150)}, ${Math.max(margin.top + 8, hover.y - 28)})`}>
                        <rect width="140" height="44" rx="6" fill="#0f172a" opacity="0.95" />
                        <text x="8" y="18" fontSize="12" fill="#fff" fontWeight="600">
                            {String(hover.point.key)}
                        </text>
                        <text x="8" y="34" fontSize="12" fill="#cbd5e1">
                            {formatNumber(hover.point.value)}
                        </text>
                    </g>
                </g>
            )}
        </svg>
    );
}

InventoryChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            value: PropTypes.number,
        })
    ).isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    type: PropTypes.oneOf(["line", "bar"]),
    color: PropTypes.string,
    margin: PropTypes.object,
    showGrid: PropTypes.bool,
    onPointClick: PropTypes.func,
};