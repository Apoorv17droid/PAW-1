const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getZones() {
  const res = await fetch(`${BASE_URL}/api/zones`);
  if (!res.ok) throw new Error("Could not load zone colors");
  return res.json();
}

export async function getCrops() {
  const res = await fetch(`${BASE_URL}/api/crops`);
  if (!res.ok) throw new Error("Could not load crop list");
  return res.json();
}

export async function geoSoil(lat, lon) {
  const res = await fetch(`${BASE_URL}/api/geo-soil`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) throw new Error("Could not look up soil zone for this location");
  return res.json();
}

export async function soilPhoto(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/soil-photo`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Could not analyze this photo");
  return res.json();
}

export async function getRecipe(zone, cropId) {
  const res = await fetch(`${BASE_URL}/api/recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zone, crop_id: cropId }),
  });
  if (!res.ok) throw new Error("Could not build a water plan");
  return res.json();
}
