"""
PAW recipe computation.

The farmer never sees voltage, gas or pH directly. The app only shows the
plain language outcome (how long to run the generator, how strong the
water is, and what to do with it). Everything below is treated as backend
only logic, matching the original product requirement that treatment
settings must never be exposed as raw controls in the interface.

These are engineering estimates built from published PAW agriculture
trends, not a lab validated recommendation for every soil and crop pair.
That caveat is returned in the API response so the frontend always shows
it next to the plan.
"""

CROPS = [
    {"id": "wheat", "icon": "wheat", "base_time": 5, "purpose": "seed", "voltage": 11, "gas_pref": "Air"},
    {"id": "rice", "icon": "wheat", "base_time": 6, "purpose": "seed", "voltage": 11, "gas_pref": "Air"},
    {"id": "maize", "icon": "corn", "base_time": 5, "purpose": "seed", "voltage": 11, "gas_pref": "Air"},
    {"id": "cotton", "icon": "cloud", "base_time": 6, "purpose": "seed_disinfect", "voltage": 15, "gas_pref": "Oxygen"},
    {"id": "sugarcane", "icon": "reed", "base_time": 8, "purpose": "sett_disinfect", "voltage": 15, "gas_pref": "Oxygen"},
    {"id": "groundnut", "icon": "peanut", "base_time": 4, "purpose": "seed_gentle", "voltage": 9, "gas_pref": "Argon"},
    {"id": "soybean", "icon": "bean", "base_time": 4, "purpose": "seed_gentle", "voltage": 9, "gas_pref": "Argon"},
    {"id": "chickpea", "icon": "pea", "base_time": 4, "purpose": "seed_gentle", "voltage": 9, "gas_pref": "Argon"},
    {"id": "mustard", "icon": "flower", "base_time": 5, "purpose": "seed", "voltage": 11, "gas_pref": "Air"},
    {"id": "tomato", "icon": "tomato", "base_time": 10, "purpose": "irrigation", "voltage": 10, "gas_pref": "Nitrogen"},
    {"id": "onion", "icon": "onion", "base_time": 5, "purpose": "seed", "voltage": 11, "gas_pref": "Air"},
    {"id": "chili", "icon": "pepper", "base_time": 8, "purpose": "irrigation", "voltage": 10, "gas_pref": "Nitrogen"},
]

# soils that are already acidic (Red, Laterite, Yellow) get gentler dosing so
# PAW does not push them more acidic. Arid soil gets a nitrate leaning boost.
ZONE_ADJUST = {
    "Alluvial": {"time": 1.0, "gas_override": None},
    "Black": {"time": 1.05, "gas_override": None},
    "Red": {"time": 0.8, "gas_override": None},
    "Laterite": {"time": 0.75, "gas_override": None},
    "Yellow": {"time": 0.8, "gas_override": None},
    "Arid": {"time": 1.15, "gas_override": "Nitrogen"},
    "Mountain": {"time": 0.95, "gas_override": None},
}

GAS_FACTOR = {
    "Air": {"ph": 1.0, "orp": 1.0},
    "Oxygen": {"ph": 0.8, "orp": 1.3},
    "Nitrogen": {"ph": 1.3, "orp": 0.8},
    "Argon": {"ph": 0.4, "orp": 0.6},
}

USE_INSTRUCTIONS = {
    "seed": "Soak seeds in this water for 20 to 30 minutes before sowing.",
    "seed_gentle": "Gentle soak, 10 to 15 minutes. This crop is sensitive to strong treatment.",
    "seed_disinfect": "Rinse seeds or setts for 10 minutes to reduce fungal risk before planting.",
    "sett_disinfect": "Rinse seeds or setts for 10 minutes to reduce fungal risk before planting.",
    "irrigation": "Mix 1 part PAW water with 5 parts normal water before using for irrigation.",
}

DISCLAIMER = (
    "This treatment plan is an engineering estimate based on published PAW agriculture "
    "trends, not a lab validated recommendation for every soil and crop pair. Confirm "
    "with a local agriculture extension officer before large scale use."
)


def find_crop(crop_id: str):
    return next((c for c in CROPS if c["id"] == crop_id), None)


def compute_recipe(zone: str, crop_id: str):
    crop = find_crop(crop_id)
    if crop is None:
        return None
    adj = ZONE_ADJUST.get(zone, ZONE_ADJUST["Alluvial"])
    gas = adj["gas_override"] or crop["gas_pref"]
    time_minutes = max(2, round(crop["base_time"] * adj["time"]))
    g = GAS_FACTOR[gas]
    base = (crop["voltage"] / 20) * (time_minutes / 30)
    ph = max(2.6, 7 - base * 4.3 * g["ph"])
    strength = "mild" if ph > 5.5 else "medium" if ph > 4 else "strong"

    return {
        "crop_id": crop["id"],
        "icon": crop["icon"],
        "purpose": crop["purpose"],
        "time_minutes": time_minutes,
        "strength": strength,
        "use_instructions": USE_INSTRUCTIONS[crop["purpose"]],
        "disclaimer": DISCLAIMER,
    }
