import React, { useEffect, useMemo, useState } from "react";

/**
 * StockLevels
 *
 * A self-contained React component to display and manage product stock levels.
 * - Fetches data from an API endpoint (default: /api/stock-levels)
 * - Supports search, low-stock filtering, sorting, pagination
 * - Inline increment/decrement with optimistic update (PATCH)
 *
 * Usage:
 * <StockLevels apiUrl="/api/stock-levels" />
 *
 * Notes:
 * - The API should return an array of items:
 *   [{ id, sku, name, location, quantity, reorderLevel }]
 * - PATCH to `${apiUrl}/${id}` with { quantity } is used to persist changes.
 */

export default function StockLevels({ apiUrl = "/api/stock-levels" }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [query, setQuery] = useState("");
    const [onlyLow, setOnlyLow] = useState(false);
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Fetch data
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        fetch(apiUrl)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
                return res.json();
            })
            .then((data) => {
                if (!mounted) return;
                setItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(err.message || "Unknown error");
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [apiUrl]);

    // Derived and filtered items
    const processed = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = items.slice();

        if (q) {
            list = list.filter(
                (it) =>
                    (it.name && it.name.toLowerCase().includes(q)) ||
                    (it.sku && it.sku.toLowerCase().includes(q)) ||
                    (it.location && it.location.toLowerCase().includes(q))
            );
        }

        if (onlyLow) {
            list = list.filter((it) => Number(it.quantity) <= Number(it.reorderLevel));
        }

        list.sort((a, b) => {
            let av = a[sortBy];
            let bv = b[sortBy];

            // normalize
            if (av == null) av = "";
            if (bv == null) bv = "";

            // numeric compare when possible
            const anum = Number(av);
            const bnum = Number(bv);
            const numeric = !Number.isNaN(anum) && !Number.isNaN(bnum);

            if (numeric) {
                return sortDir === "asc" ? anum - bnum : bnum - anum;
            }

            av = String(av).toLowerCase();
            bv = String(bv).toLowerCase();
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [items, query, onlyLow, sortBy, sortDir]);

    // Pagination slice
    const total = processed.length;
    const pageCount = Math.max(1, Math.ceil(total / perPage));
    const pageSafe = Math.min(Math.max(1, page), pageCount);
    const paged = processed.slice((pageSafe - 1) * perPage, pageSafe * perPage);

    useEffect(() => {
        if (page !== pageSafe) setPage(pageSafe);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSafe]);

    // Helpers
    function statusFor(item) {
        const qty = Number(item.quantity);
        const reorder = Number(item.reorderLevel);
        if (Number.isNaN(qty) || Number.isNaN(reorder)) return "unknown";
        if (qty <= 0) return "out";
        if (qty <= reorder) return "low";
        return "ok";
    }

    function statusColor(s) {
        switch (s) {
            case "out":
                return "#ff4d4f";
            case "low":
                return "#faad14";
            case "ok":
                return "#52c41a";
            default:
                return "#d9d9d9";
        }
    }

    // Optimistic update quantity
    async function updateQuantity(id, newQty) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: newQty } : it)));
        try {
            const res = await fetch(`${apiUrl}/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: newQty }),
            });
            if (!res.ok) throw new Error(`Update failed (${res.status})`);
            // Optionally merge returned item
            const updated = await res.json();
            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));
        } catch (err) {
            // revert on error by refetching the whole list
            console.error(err);
            setError(err.message || "Failed to update quantity");
            try {
                const r = await fetch(apiUrl);
                if (r.ok) {
                    const data = await r.json();
                    setItems(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                // ignore
            }
        }
    }

    function inc(id) {
        const it = items.find((x) => x.id === id);
        if (!it) return;
        const newQty = Number(it.quantity || 0) + 1;
        updateQuantity(id, newQty);
    }
    function dec(id) {
        const it = items.find((x) => x.id === id);
        if (!it) return;
        const newQty = Math.max(0, Number(it.quantity || 0) - 1);
        updateQuantity(id, newQty);
    }

    if (loading) {
        return (
            <div role="status" aria-live="polite" style={{ padding: 16 }}>
                Loading stock levels...
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search by name, SKU or location"
                    aria-label="Search stock items"
                    style={{
                        padding: "8px 10px",
                        minWidth: 220,
                        borderRadius: 6,
                        border: "1px solid #d9d9d9",
                    }}
                />
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input
                        type="checkbox"
                        checked={onlyLow}
                        onChange={(e) => {
                            setOnlyLow(e.target.checked);
                            setPage(1);
                        }}
                    />
                    Show only low / out of stock
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Sort
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: 6 }}
                    >
                        <option value="name">Name</option>
                        <option value="sku">SKU</option>
                        <option value="location">Location</option>
                        <option value="quantity">Quantity</option>
                        <option value="reorderLevel">Reorder level</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => setSortDir((s) => (s === "asc" ? "desc" : "asc"))}
                        aria-label="Toggle sort direction"
                        style={{
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid #d9d9d9",
                            background: "#fff",
                        }}
                    >
                        {sortDir === "asc" ? "↑" : "↓"}
                    </button>
                </label>

                <label style={{ marginLeft: "auto" }}>
                    Per page{" "}
                    <select
                        value={perPage}
                        onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        style={{ padding: "6px 8px", borderRadius: 6 }}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {error && (
                <div style={{ color: "#a8071a", marginBottom: 12 }} role="alert">
                    {error}
                </div>
            )}

            <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead style={{ background: "#fafafa", textAlign: "left" }}>
                        <tr>
                            <th style={thStyle}>SKU</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Location</th>
                            <th style={thStyle}>Quantity</th>
                            <th style={thStyle}>Reorder</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle} aria-hidden>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: 16 }}>
                                    No items found.
                                </td>
                            </tr>
                        ) : (
                            paged.map((it) => {
                                const s = statusFor(it);
                                return (
                                    <tr key={it.id} style={{ borderTop: "1px solid #f5f5f5" }}>
                                        <td style={tdStyle}>{it.sku || "—"}</td>
                                        <td style={tdStyle}>{it.name || "—"}</td>
                                        <td style={tdStyle}>{it.location || "—"}</td>
                                        <td style={{ ...tdStyle, width: 140 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <button
                                                    onClick={() => dec(it.id)}
                                                    aria-label={`Decrease ${it.name || it.sku}`}
                                                    style={smallBtn}
                                                >
                                                    −
                                                </button>
                                                <div style={{ minWidth: 40, textAlign: "center" }}>{it.quantity ?? 0}</div>
                                                <button
                                                    onClick={() => inc(it.id)}
                                                    aria-label={`Increase ${it.name || it.sku}`}
                                                    style={smallBtn}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{it.reorderLevel ?? "—"}</td>
                                        <td style={tdStyle}>
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "4px 8px",
                                                    borderRadius: 999,
                                                    background: `${statusColor(s)}20`,
                                                    color: statusColor(s),
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {s === "ok" ? "OK" : s === "low" ? "Low" : s === "out" ? "Out" : "Unknown"}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, width: 120 }}>
                                            <button
                                                onClick={async () => {
                                                    // quick set to reorder level + safety amount
                                                    const target = (Number(it.reorderLevel) || 0) + 10;
                                                    updateQuantity(it.id, target);
                                                }}
                                                style={{
                                                    padding: "6px 8px",
                                                    borderRadius: 6,
                                                    border: "1px solid #d9d9d9",
                                                    background: "#fff",
                                                }}
                                            >
                                                Replenish
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                    gap: 8,
                    flexWrap: "wrap",
                }}
            >
                <div style={{ color: "#595959" }}>
                    Showing {Math.min(total, (pageSafe - 1) * perPage + 1)}–{Math.min(total, pageSafe * perPage)} of{" "}
                    {total}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pageSafe === 1}
                        style={pageBtn(pageSafe === 1)}
                    >
                        Prev
                    </button>

                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {Array.from({ length: pageCount }).map((_, i) => {
                            const n = i + 1;
                            return (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    aria-current={n === pageSafe ? "page" : undefined}
                                    style={{
                                        ...pageBtn(false),
                                        fontWeight: n === pageSafe ? 700 : 400,
                                        background: n === pageSafe ? "#e6f7ff" : undefined,
                                    }}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={pageSafe === pageCount}
                        style={pageBtn(pageSafe === pageCount)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Styles (inline for self-contained component) */
const thStyle = {
    padding: "10px 12px",
    fontSize: 13,
    color: "#262626",
    textAlign: "left",
};
const tdStyle = {
    padding: "10px 12px",
    fontSize: 14,
    color: "#333",
    verticalAlign: "middle",
};

const smallBtn = {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #d9d9d9",
    background: "#fff",
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
};

function pageBtn(disabled) {
    return {
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #d9d9d9",
        background: disabled ? "#fafafa" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
    };
}