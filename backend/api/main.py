import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

import geo_data
import recipe
import soil_model

app = FastAPI(title="PAW Sahayak API")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GeoRequest(BaseModel):
    lat: float
    lon: float


class RecipeRequest(BaseModel):
    zone: str
    crop_id: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/zones")
def zones():
    return {"colors": soil_model.ZONE_COLORS}


@app.get("/api/crops")
def crops():
    return {"crops": [{"id": c["id"], "icon": c["icon"]} for c in recipe.CROPS]}


@app.post("/api/geo-soil")
def geo_soil(body: GeoRequest):
    if not (-90 <= body.lat <= 90) or not (-180 <= body.lon <= 180):
        raise HTTPException(status_code=400, detail="Coordinates out of range")
    result = geo_data.nearest_state(body.lat, body.lon)
    result["note"] = (
        "This uses your area's typical soil zone, not a lab test. "
        "A soil test gives the most accurate result."
    )
    return result


@app.post("/api/soil-photo")
async def soil_photo(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image file")
    result = soil_model.predict(img)
    result["note"] = (
        "This is a photo based estimate, not a lab test. "
        "A soil test gives the most accurate result."
    )
    return result


@app.post("/api/recipe")
def get_recipe(body: RecipeRequest):
    result = recipe.compute_recipe(body.zone, body.crop_id)
    if result is None:
        raise HTTPException(status_code=400, detail="Unknown crop")
    return result
