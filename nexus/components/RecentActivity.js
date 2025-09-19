import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";

// /workspaces/Nexus-Inventory/nexus/components/RecentActivity.js

function timeAgo(timestamp) {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const days = Math.floor(hr / 24);
    return `${days}d`;
}

export default function RecentActivity({
    apiEndpoint = "/api/recent-activities",
    limit = 10,
    pollInterval = null, // ms, set to number to enable polling
    initialData = null,
}) {
    const [activities, setActivities] = useState(initialData || []);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiEndpoint, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            // Expecting array of { id, user, action, target, timestamp }
            setActivities(Array.isArray(data) ? data.slice(0, limit) : []);
        } catch (err) {
            setError(err.message || "Failed to load activities");
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, limit]);

    useEffect(() => {
        if (!initialData) fetchActivities();
    }, [fetchActivities, initialData]);

    useEffect(() => {
        if (!pollInterval) return undefined;
        const id = setInterval(() => fetchActivities(), pollInterval);
        return () => clearInterval(id);
    }, [fetchActivities, pollInterval]);

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <strong>Recent Activity</strong>
                <div>
                    <button onClick={fetchActivities} style={buttonStyle} disabled={loading}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {error && <div style={errorStyle}>Error: {error}</div>}

            {!loading && activities.length === 0 && <div style={emptyStyle}>No recent activity</div>}

            <ul style={listStyle}>
                {activities.map((a) => (
                    <li key={a.id || `${a.timestamp}-${Math.random()}`} style={itemStyle}>
                        <div style={mainStyle}>
                            <span style={userStyle}>{a.user || "Unknown"}</span>
                            <span style={actionStyle}>{a.action || "did something"}</span>
                            {a.target && <span style={targetStyle}> {a.target}</span>}
                        </div>
                        <div style={timeStyle} title={a.timestamp ? new Date(a.timestamp).toString() : ""}>
                            {timeAgo(a.timestamp)}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

RecentActivity.propTypes = {
    apiEndpoint: PropTypes.string,
    limit: PropTypes.number,
    pollInterval: PropTypes.number,
    initialData: PropTypes.array,
};

/* Inline styles kept simple so the component works out-of-the-box */
const containerStyle = {
    border: "1px solid #e6e6e6",
    borderRadius: 6,
    padding: 12,
    maxWidth: 640,
    background: "#fff",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
};

const buttonStyle = {
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 4,
    border: "1px solid #ccc",
    background: "#fafafa",
    cursor: "pointer",
};

const listStyle = {
    listStyle: "none",
    padding: 0,
    margin: 0,
};

const itemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 6px",
    borderBottom: "1px solid #f1f1f1",
};

const mainStyle = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#333",
};

const userStyle = {
    fontWeight: 600,
};

const actionStyle = {
    color: "#555",
};

const targetStyle = {
    color: "#0a66c2",
};

const timeStyle = {
    fontSize: 12,
    color: "#888",
    minWidth: 40,
    textAlign: "right",
};

const emptyStyle = {
    padding: "12px 6px",
    color: "#666",
};

const errorStyle = {
    padding: "8px",
    color: "#7a1f1f",
    background: "#fff1f1",
    border: "1px solid #ffd3d3",
    borderRadius: 4,
    marginBottom: 8,
};