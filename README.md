# PAW Sahayak

A farmer facing app for a Plasma Activated Water (PAW) generator. The farmer only sees three steps. Find the soil, pick the crop, get a ready to use water plan. No voltage, gas, or pH controls are ever shown. All of that is computed on the backend.

## What determines what

The frontend never guesses a soil type or a treatment plan on its own. Three backend endpoints do that work.

- `POST /api/geo-soil` takes a GPS latitude and longitude (asked for with the browser's normal location permission prompt) and returns the nearest matching state and its typical soil zone. This is a nearest centroid lookup, not a boundary accurate GIS query, and the API response says so.
- `POST /api/soil-photo` runs a trained multinomial logistic regression model (feature extraction plus classification, both in `backend/api/soil_model.py`) on an uploaded soil photo and returns a soil class with a confidence score. The model was trained on 951 labeled soil photos and scored 76.9 percent on a held out test set, both numbers are returned in the response so the frontend can show them honestly instead of overstating accuracy.
- `POST /api/recipe` takes a soil zone and a crop id and computes a treatment plan (minutes to run the generator, a strength label, and a plain language instruction). The underlying voltage, gas, and pH numbers are computed in `backend/api/recipe.py` and used internally, never returned to the farmer facing UI.

A tap to select map of India (`frontend/src/components/MapModal.jsx`) is the fallback for when GPS is denied or unavailable.

## Project layout

```
backend/                 deployed on Vercel as a Python serverless function
  api/
    main.py                FastAPI app and routes
    soil_model.py            photo based ML classifier
    geo_data.py               GPS based nearest state lookup
    recipe.py                  crop database and recipe computation
    model_weights.json          trained model weights
  requirements.txt
  vercel.json               tells Vercel to route every request to api/main.py

frontend/                deployed on Vercel as a static Vite build
  src/App.jsx               main screen and flow
  src/components/MapModal.jsx   fallback state picker map
  src/translations.js         UI text in 9 languages
  src/cropData.js              crop icons and names
  src/indiaPaths.js             state boundary shapes for the fallback map
  src/api.js                    fetch wrappers for the backend
```

Backend and frontend are two separate Vercel projects pointed at the same GitHub repo, each with a different root directory. This keeps one repo but two independent deployments, so a change to one does not force a rebuild of the other.

## Running it locally

Backend.

```
cd backend/api
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --reload
```

The API is now at `http://localhost:8000`. Open `http://localhost:8000/docs` to try each endpoint directly.

Frontend, in a second terminal.

```
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

## Uploading to GitHub

```
cd paw-sahayak
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Deploying on Vercel, no card required

Vercel's free Hobby plan does not ask for a card. You will create two separate Vercel projects from the same repo, one for the backend and one for the frontend.

### Backend project

1. Go to vercel.com, sign up or log in, and connect your GitHub account.
2. Click Add New, then Project, and pick your repo.
3. Before deploying, open the project's settings and set Root Directory to `backend`. Vercel will detect `vercel.json` and treat this as a Python project.
4. Deploy. Once it finishes, copy the URL Vercel gives this project, it will look like `https://your-backend-name.vercel.app`.
5. Open this project's Settings, then Environment Variables, and add `ALLOWED_ORIGINS` set to `*` for now (you can tighten this later to just your frontend's URL).

### Frontend project

1. Back on the Vercel dashboard, click Add New, then Project again, and pick the same repo a second time.
2. Set Root Directory to `frontend` this time. Vercel auto detects it as a Vite app.
3. Before deploying, open Environment Variables and add `VITE_API_URL` set to the backend URL you copied above.
4. Deploy. Once it finishes, open the URL Vercel gives this project, that is your live app.

If you ever change the `VITE_API_URL` value later, trigger a new deploy of the frontend project afterward, Vite bakes that value in at build time.

## Honest limits worth stating in a demo

- The GPS lookup uses state centroids, not real soil survey boundaries. A farm near a state border can be misclassified. The API always returns a note saying this.
- The photo classifier is a real trained model, not a placeholder, but 76.9 percent test accuracy means roughly one in four photos will be misclassified. The confidence score is shown to the farmer for this reason.
- The crop and soil recipe numbers are engineering estimates built from published PAW agriculture research trends, not a lab validated result for every soil and crop pair. The app says this on every result screen.
