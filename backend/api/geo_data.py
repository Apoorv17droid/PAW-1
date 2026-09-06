"""
GPS based soil zone lookup.

This uses each Indian state's approximate centroid rather than full
boundary polygons, so it is a nearest state estimate and not a survey
grade lookup. That limit is returned to the frontend alongside the
result so it can be shown to the farmer honestly.
"""

import math

# approximate centroid latitude and longitude for each state or union territory
STATE_CENTROIDS = {
    "Jammu and Kashmir": (33.7782, 76.5762),
    "Himachal Pradesh": (31.1048, 77.1734),
    "Uttarakhand": (30.0668, 79.0193),
    "Sikkim": (27.5330, 88.5122),
    "Arunachal Pradesh": (28.2180, 94.7278),
    "Nagaland": (26.1584, 94.5624),
    "Manipur": (24.6637, 93.9063),
    "Mizoram": (23.1645, 92.9376),
    "Punjab": (31.1471, 75.3412),
    "Haryana": (29.0588, 76.0856),
    "Delhi": (28.7041, 77.1025),
    "Chandigarh": (30.7333, 76.7794),
    "Uttar Pradesh": (26.8467, 80.9462),
    "Bihar": (25.0961, 85.3131),
    "West Bengal": (22.9868, 87.8550),
    "Assam": (26.2006, 92.9376),
    "Rajasthan": (27.0238, 74.2179),
    "Tripura": (23.9408, 91.9882),
    "Meghalaya": (25.4670, 91.3662),
    "Goa": (15.2993, 74.1240),
    "Kerala": (10.8505, 76.2711),
    "Lakshadweep": (10.5667, 72.6417),
    "Andaman and Nicobar Islands": (11.7401, 92.6586),
    "Jharkhand": (23.6102, 85.2799),
    "Odisha": (20.9517, 85.0985),
    "Chhattisgarh": (21.2787, 81.8661),
    "Karnataka": (15.3173, 75.7139),
    "Andhra Pradesh": (15.9129, 79.7400),
    "Telangana": (18.1124, 79.0193),
    "Tamil Nadu": (11.1271, 78.6569),
    "Puducherry": (11.9416, 79.8083),
    "Madhya Pradesh": (22.9734, 78.6569),
    "Gujarat": (22.2587, 71.1924),
    "Maharashtra": (19.7515, 75.7139),
    "Dadra and Nagar Haveli and Daman and Diu": (20.1809, 73.0169),
}

STATE_ZONE = {
    "Jammu and Kashmir": "Mountain", "Himachal Pradesh": "Mountain", "Uttarakhand": "Mountain",
    "Sikkim": "Mountain", "Arunachal Pradesh": "Mountain", "Nagaland": "Mountain",
    "Manipur": "Mountain", "Mizoram": "Mountain",
    "Punjab": "Alluvial", "Haryana": "Alluvial", "Delhi": "Alluvial", "Chandigarh": "Alluvial",
    "Uttar Pradesh": "Alluvial", "Bihar": "Alluvial", "West Bengal": "Alluvial", "Assam": "Alluvial",
    "Rajasthan": "Arid",
    "Tripura": "Laterite", "Meghalaya": "Laterite", "Goa": "Laterite", "Kerala": "Laterite",
    "Lakshadweep": "Laterite", "Andaman and Nicobar Islands": "Laterite",
    "Jharkhand": "Red", "Odisha": "Red", "Chhattisgarh": "Red", "Karnataka": "Red",
    "Andhra Pradesh": "Red", "Telangana": "Red", "Tamil Nadu": "Red", "Puducherry": "Red",
    "Madhya Pradesh": "Black", "Gujarat": "Black", "Maharashtra": "Black",
    "Dadra and Nagar Haveli and Daman and Diu": "Black",
}


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def nearest_state(lat: float, lon: float):
    best_state, best_dist = None, None
    for state, (slat, slon) in STATE_CENTROIDS.items():
        dist = _haversine_km(lat, lon, slat, slon)
        if best_dist is None or dist < best_dist:
            best_state, best_dist = state, dist
    return {
        "state": best_state,
        "zone": STATE_ZONE[best_state],
        "distance_km": round(best_dist, 1),
    }
