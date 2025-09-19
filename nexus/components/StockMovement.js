import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

// /workspaces/Nexus-Inventory/nexus/components/StockMovement.js

/**
 * StockMovement
 * - Fetches and displays stock movement records
 * - Supports basic filtering (date range, product search)
 * - Allows adding a simple movement (creates via POST) and exporting visible rows to CSV
 *
 * Props:
 * - apiBase: base URL for API endpoints (GET /stock-movements, POST /stock-movements)
 * - initialPageSize: number of rows per page
 *
 * Note: This component is intentionally dependency-free (no external UI libs).
 */

function formatDateIsoToLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function csvEscape(value) {
    if (value == null) return "";
    const s = String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export default function StockMovement({ apiBase = "/api", initialPageSize = 25 }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(initialPageSize);

    const [filterProduct, setFilterProduct] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    const [showAdd, setShowAdd] = useState(false);
    const [newMovement, setNewMovement] = useState({
        date: new Date().toISOString().slice(0, 16),
        sku: "",
        productName: "",
        qty: 0,
        type: "IN",
        location: "",
        notes: "",
    });

    const abortRef = useRef(null);

    useEffect(() => {
        fetchRows();
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, filterProduct, filterFrom, filterTo]);

    async function fetchRows() {
        if (abortRef.current) abortRef.current.abort();
        const ab = new AbortController();
        abortRef.current = ab;

        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (filterProduct) params.set("product", filterProduct);
        if (filterFrom) params.set("from", filterFrom);
        if (filterTo) params.set("to", filterTo);

        try {
            const res = await fetch(`${apiBase}/stock-movements?${params.toString()}`, { signal: ab.signal });
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            const data = await res.json();
            // Expecting { rows: [...], total: number } or an array
            if (Array.isArray(data)) {
                setRows(data);
            } else if (data && Array.isArray(data.rows)) {
                setRows(data.rows);
            } else {
                setRows([]);
            }
        } catch (err) {
            if (err.name !== "AbortError") setError(err.message || String(err));
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = {
                date: newMovement.date,
                sku: newMovement.sku,
                productName: newMovement.productName,
                qty: Number(newMovement.qty),
                type: newMovement.type,
                location: newMovement.location,
                notes: newMovement.notes,
            };
            const res = await fetch(`${apiBase}/stock-movements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Create failed: ${res.status}`);
            }
            // reload
            setShowAdd(false);
            setNewMovement({
                date: new Date().toISOString().slice(0, 16),
                sku: "",
                productName: "",
                qty: 0,
                type: "IN",
                location: "",
                notes: "",
            });
            fetchRows();
        } catch (err) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }

    function exportVisibleToCsv() {
        if (!rows || rows.length === 0) return;
        const headers = ["date", "sku", "productName", "qty", "type", "location", "notes"];
        const csv = [headers.join(",")]
            .concat(
                rows.map((r) =>
                    headers.map((h) => csvEscape(h === "date" ? formatDateIsoToLocal(r[h]) : r[h])).join(",")
                )
            )
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stock-movements-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>Stock Movements</h2>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                    placeholder="Product SKU or name"
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    style={{ padding: 6 }}
                />
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    From
                    <input type="datetime-local" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                </label>
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    To
                    <input type="datetime-local" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                </label>

                <button onClick={() => { setPage(1); fetchRows(); }} disabled={loading}>
                    Apply
                </button>

                <button onClick={() => { setFilterProduct(""); setFilterFrom(""); setFilterTo(""); setPage(1); }} disabled={loading}>
                    Clear
                </button>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "Add Movement"}</button>
                    <button onClick={exportVisibleToCsv} disabled={rows.length === 0}>
                        Export CSV
                    </button>
                </div>
            </div>

            {showAdd && (
                <form onSubmit={handleCreate} style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
                        <label>
                            Date
                            <input
                                type="datetime-local"
                                value={newMovement.date}
                                onChange={(e) => setNewMovement((s) => ({ ...s, date: e.target.value }))}
                                required
                            />
                        </label>

                        <label>
                            SKU
                            <input value={newMovement.sku} onChange={(e) => setNewMovement((s) => ({ ...s, sku: e.target.value }))} />
                        </label>

                        <label>
                            Product name
                            <input
                                value={newMovement.productName}
                                onChange={(e) => setNewMovement((s) => ({ ...s, productName: e.target.value }))}
                            />
                        </label>

                        <label>
                            Qty
                            <input
                                type="number"
                                value={newMovement.qty}
                                onChange={(e) => setNewMovement((s) => ({ ...s, qty: e.target.value }))}
                                required
                            />
                        </label>

                        <label>
                            Type
                            <select value={newMovement.type} onChange={(e) => setNewMovement((s) => ({ ...s, type: e.target.value }))}>
                                <option value="IN">IN</option>
                                <option value="OUT">OUT</option>
                                <option value="ADJUST">ADJUST</option>
                            </select>
                        </label>

                        <label>
                            Location
                            <input value={newMovement.location} onChange={(e) => setNewMovement((s) => ({ ...s, location: e.target.value }))} />
                        </label>

                        <label style={{ gridColumn: "1 / -1" }}>
                            Notes
                            <input value={newMovement.notes} onChange={(e) => setNewMovement((s) => ({ ...s, notes: e.target.value }))} />
                        </label>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button type="submit" disabled={loading}>
                            Create
                        </button>
                        <button type="button" onClick={() => setShowAdd(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div style={{ marginTop: 12 }}>
                {loading && <div>Loading...</div>}
                {error && <div style={{ color: "crimson" }}>Error: {error}</div>}

                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                    <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                            <th style={{ padding: "6px 8px" }}>Date</th>
                            <th style={{ padding: "6px 8px" }}>SKU</th>
                            <th style={{ padding: "6px 8px" }}>Product</th>
                            <th style={{ padding: "6px 8px" }}>Qty</th>
                            <th style={{ padding: "6px 8px" }}>Type</th>
                            <th style={{ padding: "6px 8px" }}>Location</th>
                            <th style={{ padding: "6px 8px" }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && !loading && (
                            <tr>
                                <td colSpan="7" style={{ padding: 12 }}>
                                    No movements found.
                                </td>
                            </tr>
                        )}
                        {rows.map((r, idx) => (
                            <tr key={r.id || idx} style={{ borderBottom: "1px solid #f3f3f3" }}>
                                <td style={{ padding: 8, verticalAlign: "top", width: 180 }}>{formatDateIsoToLocal(r.date)}</td>
                                <td style={{ padding: 8, verticalAlign: "top" }}>{r.sku}</td>
                                <td style={{ padding: 8, verticalAlign: "top" }}>{r.productName}</td>
                                <td style={{ padding: 8, verticalAlign: "top" }}>{r.qty}</td>
                                <td style={{ padding: 8, verticalAlign: "top" }}>{r.type}</td>
                                <td style={{ padding: 8, verticalAlign: "top" }}>{r.location}</td>
                                <td style={{ padding: 8, verticalAlign: "top" }}>{r.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                        Prev
                    </button>
                    <span>Page {page}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={loading}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

StockMovement.propTypes = {
    apiBase: PropTypes.string,
    initialPageSize: PropTypes.number,
};