"use client";

import { useEffect, useState, useCallback } from 'react';

export default function InventoryTable({ initialQuery = {} }){
  const [skus, setSkus] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('createdAt');
  const [dir, setDir] = useState('desc');
  const [q, setQ] = useState(initialQuery.q || '');

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, dir });
    if (q) params.set('q', q);
    const res = await fetch('/api/skus?' + params.toString());
    const json = await res.json();
    setSkus(json.items || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [page, pageSize, sort, dir, q]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  function toggleSort(field){
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSort(field); setDir('asc'); }
    setPage(1);
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
  <input placeholder="Search by name or SKU" value={q} onChange={e=>setQ(e.target.value)} />
  <button onClick={() => { setPage(1); if (page === 1) fetchPage(); }}>Search</button>
      </div>

      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th onClick={() => toggleSort('sku')}>SKU</th>
            <th onClick={() => toggleSort('name')}>Name</th>
            <th onClick={() => toggleSort('onHand')}>On hand</th>
            <th onClick={() => toggleSort('createdAt')}>Created</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={4}>Loading…</td></tr> : skus.map(s => (
            <tr key={s.id}>
              <td>{s.sku}</td>
              <td>{s.name}</td>
              <td>{s.onHand}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
        <div>Showing {skus.length} of {total}</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page * pageSize >= total}>Next</button>
        </div>
      </div>
    </div>
  );
}
