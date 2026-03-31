const BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

export async function generateAd(payload) {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Generate failed");
  return data;
}

export async function getSavedAds() {
  const res = await fetch(`${BASE}/ads`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load ads");
  return data;
}

export async function getSingleAd(id) {
  const res = await fetch(`${BASE}/ads/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ad not found");
  return data;
}

export async function deleteAd(id) {
  const res = await fetch(`${BASE}/ads/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Delete failed");
  return data;
}

export async function chatRefine(product, concept, message) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product, concept, message })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Chat failed");
  return data.reply;
}
