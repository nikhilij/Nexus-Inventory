// Simple in-memory mock database for API route development and tests
// Note: this is not persistent and is intended for local development only.
const now = () => new Date().toISOString();

const generateId = (prefix = "item_") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

const db = {
   products: [
      {
         id: generateId("prod_"),
         name: "Sample Product",
         sku: "SKU-001",
         description: "Demo product",
         createdAt: now(),
      },
   ],
   orders: [
      {
         id: generateId("ord_"),
         orderNumber: "ORD-1001",
         customerName: "Acme Corp",
         status: "pending",
         createdAt: now(),
      },
   ],
   inventory: [{ id: generateId("inv_"), productId: null, quantity: 0, location: "Main Warehouse", updatedAt: now() }],
   suppliers: [{ id: generateId("sup_"), name: "Default Supplier", contact: "supplier@example.com", createdAt: now() }],
   warehouses: [{ id: generateId("wh_"), name: "Main Warehouse", address: "", createdAt: now() }],
   users: [{ id: generateId("user_"), name: "Demo User", email: "demo@example.com", role: "admin", createdAt: now() }],
   notifications: [
      { id: generateId("note_"), title: "Welcome", message: "Welcome to Nexus demo", read: false, createdAt: now() },
   ],
   reports: [],
   settings: { siteName: "Nexus Inventory", locale: "en-US" },
   profile: { companyName: "Demo Co", contactEmail: "demo@example.com" },
   analytics: { visits: 123, sales: 456 },
};

function list(collection) {
   const col = db[collection];
   if (!col) return null;
   return Array.isArray(col) ? col : col;
}

function find(collection, id) {
   const col = db[collection];
   if (!col || !Array.isArray(col)) return null;
   return col.find((i) => i.id === id) || null;
}

function create(collection, data) {
   if (!db[collection]) return null;
   if (Array.isArray(db[collection])) {
      const item = { id: generateId(collection + "_"), createdAt: now(), ...data };
      db[collection].unshift(item);
      return item;
   }
   // for singleton objects (settings/profile/analytics)
   db[collection] = { ...db[collection], ...data };
   return db[collection];
}

function update(collection, id, data) {
   if (!db[collection]) return null;
   if (Array.isArray(db[collection])) {
      const idx = db[collection].findIndex((i) => i.id === id);
      if (idx === -1) return null;
      db[collection][idx] = { ...db[collection][idx], ...data, updatedAt: now() };
      return db[collection][idx];
   }
   db[collection] = { ...db[collection], ...data };
   return db[collection];
}

function remove(collection, id) {
   if (!db[collection] || !Array.isArray(db[collection])) return false;
   const idx = db[collection].findIndex((i) => i.id === id);
   if (idx === -1) return false;
   db[collection].splice(idx, 1);
   return true;
}

export { db, list, find, create, update, remove };
