import { useEffect, useRef, useState } from "react";
import { MapPin, Camera, Droplets, Globe, Loader2, CheckCircle2, Info, Sprout, Leaf } from "lucide-react";
import MapModal from "./components/MapModal.jsx";
import { LANGS, tr } from "./translations.js";
import { CROP_ICONS, cropName } from "./cropData.js";
import { ZONE_COLORS } from "./indiaPaths.js";
import { getCrops, geoSoil, soilPhoto, getRecipe } from "./api.js";

const FALLBACK_CROPS = [
  "wheat", "rice", "maize", "cotton", "sugarcane",
  "groundnut", "soybean", "chickpea", "mustard", "tomato", "onion", "chili",
].map((id) => ({ id, icon: id === "wheat" || id === "rice" ? "wheat" : id }));

export default function App() {
  const [lang, setLang] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [gpsWorking, setGpsWorking] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [location, setLocation] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [photoResult, setPhotoResult] = useState(null);
  const [photoError, setPhotoError] = useState(false);

  const [crops, setCrops] = useState(FALLBACK_CROPS);
  const [crop, setCrop] = useState(null);

  const [buildingPlan, setBuildingPlan] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [recipeError, setRecipeError] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    getCrops()
      .then((data) => {
        if (data && data.crops && data.crops.length) setCrops(data.crops);
      })
      .catch(() => {});
  }, []);

  const effectiveZone = photoResult ? photoResult.label : location ? location.zone : null;

  function useGps() {
    setGpsError(false);
    if (!navigator.geolocation) {
      setGpsError(true);
      return;
    }
    setGpsWorking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await geoSoil(pos.coords.latitude, pos.coords.longitude);
          setLocation({ state: result.state, zone: result.zone, source: "gps" });
          setPhotoResult(null);
        } catch {
          setGpsError(true);
        }
        setGpsWorking(false);
      },
      () => {
        setGpsWorking(false);
        setGpsError(true);
      },
      { timeout: 10000 }
    );
  }

  function handleMapSelect(name, zone) {
    setLocation({ state: name, zone, source: "map" });
    setPhotoResult(null);
    setShowMap(false);
  }

  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPhotoError(false);
    setAnalyzing(true);
    soilPhoto(file)
      .then((result) => {
        setPhotoResult({ label: result.label, confidence: result.confidence });
      })
      .catch(() => setPhotoError(true))
      .finally(() => setAnalyzing(false));
  }

  function generate() {
    if (!effectiveZone || !crop) return;
    setRecipeError(false);
    setBuildingPlan(true);
    getRecipe(effectiveZone, crop)
      .then((result) => setRecipe(result))
      .catch(() => setRecipeError(true))
      .finally(() => setBuildingPlan(false));
  }

  function startOver() {
    setLocation(null);
    setPhotoResult(null);
    setCrop(null);
    setRecipe(null);
    setGpsError(false);
    setPhotoError(false);
    setRecipeError(false);
  }

  const currentStep = recipe ? 3 : effectiveZone ? 2 : 1;

  return (
    <div className="app-shell">
      <div className="app-inner">
        <aside className="side-panel">
          <div className="brand-row">
            <div className="brand-badge">
              <Droplets size={22} color="#fff" />
            </div>
            <div>
              <div className="brand-title">{tr("appTitle", lang)}</div>
              <div className="brand-tagline">{tr("tagline", lang)}</div>
            </div>
          </div>

          <button className="lang-btn" onClick={() => setShowLangPicker((s) => !s)}>
            <Globe size={15} /> {LANGS.find((l) => l.code === lang)?.native}
          </button>
          {showLangPicker && (
            <div className="lang-grid">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={"lang-option" + (lang === l.code ? " active" : "")}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangPicker(false);
                  }}
                >
                  {l.native}
                </button>
              ))}
            </div>
          )}

          <div className="how-card">
            <div className="how-title">{tr("howItWorksTitle", lang)}</div>
            <div className={"how-step" + (currentStep === 1 ? " active" : currentStep > 1 ? " done" : "")}>
              <span className="how-num">1</span>
              <span>{tr("howStep1", lang)}</span>
            </div>
            <div className={"how-step" + (currentStep === 2 ? " active" : currentStep > 2 ? " done" : "")}>
              <span className="how-num">2</span>
              <span>{tr("howStep2", lang)}</span>
            </div>
            <div className={"how-step" + (currentStep === 3 ? " active" : "")}>
              <span className="how-num">3</span>
              <span>{tr("howStep3", lang)}</span>
            </div>
          </div>

          <div className="leaf-illustration" aria-hidden="true">
            <Leaf size={70} strokeWidth={1.2} />
          </div>
        </aside>

        <main className="main-panel">
          <div className="card">
            <div className="card-title">
              <span className="step-badge">1</span>
              {tr("stepLocationTitle", lang)}
            </div>

            {!location && !photoResult && (
              <>
                <button className="primary-btn" onClick={useGps} disabled={gpsWorking}>
                  {gpsWorking ? <Loader2 size={16} className="spin" /> : <MapPin size={16} />}
                  {gpsWorking ? tr("gpsWorking", lang) : tr("useGpsBtn", lang)}
                </button>
                <p className="fine-print">{tr("permissionNote", lang)}</p>
                {gpsError && <p className="warning-text">{tr("gpsDenied", lang)}</p>}
                <div className="divider-row">
                  <span className="divider-line" />
                  <span>{tr("orWord", lang)}</span>
                  <span className="divider-line" />
                </div>
                <button className="secondary-btn" onClick={() => setShowMap(true)}>
                  <MapPin size={16} /> {tr("tapMapBtn", lang)}
                </button>
              </>
            )}

            {location && !photoResult && (
              <div className="result-pill">
                <span className="swatch" style={{ background: ZONE_COLORS[location.zone] }} />
                <div>
                  <div className="pill-title">{location.state}</div>
                  <div className="pill-sub">{tr("zoneFound", lang)} {location.zone}</div>
                </div>
                <button className="text-btn" onClick={() => setShowMap(true)}>{tr("tapMapBtn", lang)}</button>
              </div>
            )}

            <div className="divider-row" style={{ marginTop: 16 }}>
              <span className="divider-line" />
              <span>{tr("photoOrText", lang)}</span>
              <span className="divider-line" />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
            <button className="secondary-btn" onClick={() => fileRef.current.click()}>
              <Camera size={16} /> {tr("takePhotoBtn", lang)}
            </button>

            {analyzing && (
              <div className="analyzing-row">
                <Loader2 size={14} className="spin" /> {tr("analyzingText", lang)}
              </div>
            )}
            {photoError && <p className="warning-text">{tr("gpsDenied", lang)}</p>}

            {photoResult && !analyzing && (
              <div className="result-pill">
                <span className="swatch" style={{ background: ZONE_COLORS[photoResult.label] }} />
                <div>
                  <div className="pill-title">{photoResult.label}</div>
                  <div className="pill-sub">{Math.round(photoResult.confidence * 100)}% {tr("confidenceWord", lang)}</div>
                </div>
              </div>
            )}
            {photoResult && location && location.zone !== photoResult.label && (
              <div className="mismatch-note">
                <Info size={14} /> {tr("mismatchWarning", lang)}
              </div>
            )}
          </div>

          {effectiveZone && (
            <div className="card">
              <div className="card-title">
                <span className="step-badge">2</span>
                {tr("stepCropTitle", lang)}
              </div>
              <div className="crop-grid">
                {crops.map((c) => (
                  <button
                    key={c.id}
                    className={"crop-chip" + (crop === c.id ? " active" : "")}
                    onClick={() => {
                      setCrop(c.id);
                      setRecipe(null);
                    }}
                  >
                    <span className="crop-emoji">{CROP_ICONS[c.icon] || "🌱"}</span>
                    <span className="crop-label">{cropName(c.id, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {effectiveZone && crop && !recipe && (
            <button className="primary-btn generate-btn" onClick={generate} disabled={buildingPlan}>
              {buildingPlan ? <Loader2 size={16} className="spin" /> : <Sprout size={16} />}
              {buildingPlan ? tr("buildingPlan", lang) : tr("generateBtn", lang)}
            </button>
          )}
          {recipeError && <p className="warning-text">{tr("gpsDenied", lang)}</p>}

          {recipe && (
            <div className="card result-card">
              <div className="card-title light">
                <span className="step-badge light">3</span>
                {tr("stepResultTitle", lang)}
              </div>
              <div className="result-crop-row">
                <span className="crop-emoji large">{CROP_ICONS[recipe.icon] || "🌱"}</span>
                <span className="result-crop-name">{cropName(recipe.crop_id, lang)}</span>
              </div>
              <div className="result-stats">
                <div>
                  <div className="stat-label">{tr("readyInLabel", lang)}</div>
                  <div className="stat-value">{recipe.time_minutes} {tr("minutesWord", lang)}</div>
                </div>
                <div>
                  <div className="stat-label">{tr("strengthLabel", lang)}</div>
                  <div className="stat-value">{tr(recipe.strength, lang)}</div>
                </div>
              </div>
              <div className="instructions-box">
                <CheckCircle2 size={15} />
                <span>{tr("purpose_" + recipe.purpose, lang)}</span>
              </div>
              <button className="ghost-btn" onClick={startOver}>{tr("startOverBtn", lang)}</button>
            </div>
          )}

          <p className="disclaimer">{tr("disclaimerText", lang)}</p>
        </main>
      </div>

      {showMap && <MapModal lang={lang} onClose={() => setShowMap(false)} onSelect={handleMapSelect} />}
    </div>
  );
}
