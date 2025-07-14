# Fashion VTON: Pose-Guided Virtual Try-On and Fashion Intelligence

Fashion VTON is a modular virtual try-on and fashion recommendation platform built around SCW-VTON shape-aware warping, OpenPose-derived pose conditioning, visual similarity search, catalog filtering, and styling personalization workflows.

The project combines a React product experience with a Flask API layer that orchestrates virtual try-on, catalog retrieval, recommendation search, color analysis notebooks, and optional third-party generation hooks. It is structured as a research-to-product workspace: model code and notebooks are retained for experimentation, while application code is separated into backend and frontend modules.

## Project Overview

The system is designed to support an end-to-end fashion try-on workflow:

1. A user selects or uploads a person image.
2. A catalog garment is selected through search, filters, or recommendation retrieval.
3. The backend prepares the configured person, cloth, pose, parsing, and model paths.
4. SCW-VTON performs pose-guided, shape-aware warping for try-on generation.
5. Recommendation and styling modules support visual search, attribute-aware reranking, skin-tone analysis, seasonal palette suggestions, and optional 360-degree model video generation.

## Key Features

- Pose-guided virtual try-on pipeline using SCW-VTON shape-aware warping and OpenPose-derived pose inputs.
- React catalog dashboard with dynamic filters, product detail flows, try-on actions, and similar-item retrieval.
- Flask backend with separated route, service, and configuration modules.
- Visual fashion recommendation pipeline using EfficientNet/Xception-style embeddings with k-NN retrieval.
- Attribute-aware reranking and hard filters for catalog search refinement.
- Skin-tone and seasonal color analysis notebooks using segmentation-driven mask extraction and dominant RGB palette mapping.
- Optional Segmind integration hooks for hosted try-on and 360-degree model video generation.
- Configuration-driven runtime paths for datasets, checkpoints, catalog assets, embeddings, and external APIs.

## Architecture

### Frontend

The frontend is a Vite React application under `website/`. It provides the product browsing and try-on interface while consuming backend APIs through `VITE_BACKEND_URL`.

Core responsibilities:

- Product listing and category views.
- Dynamic catalog filters from backend metadata.
- Try-on request submission.
- Similar-product retrieval.
- Search parsing through the backend instead of exposing API keys in the browser.

### Backend

The backend is a Flask application under `backend/vton_api/`. It separates configuration, routes, and service logic so the try-on system, catalog API, recommendation engine, and third-party integrations can evolve independently.

Core responsibilities:

- Catalog API and recommendation endpoints.
- SCW-VTON orchestration.
- Upload and output handling.
- Segmind try-on and 360-degree generation integration.
- Centralized environment-based configuration.
- Backend-only search parsing with OpenAI-compatible model configuration.

### Model and Research Modules

The repository retains model and research code in separate folders:

- `SCW-VTON/` contains the shape-aware virtual try-on implementation used by the main try-on pipeline.
- `openpose/` contains the pose estimation dependency used to produce pose-conditioned inputs.
- `fashion-recommendation-system/` contains embedding extraction and recommendation exploration code.
- `color_analysis.ipynb` contains segmentation-based skin-tone and seasonal color analysis experiments.
- `product_generation.ipynb` contains product generation and experimentation workflows.

## Pipeline

### 1. Pose and Parsing Inputs

Person images are expected to have the required pose and parsing artifacts available through the configured dataset paths. The codebase avoids fixed local paths and reads the relevant roots from environment variables.

### 2. Shape-Aware Try-On

SCW-VTON is used as the primary virtual try-on implementation. The backend invokes the configured SCW-VTON scripts with runtime checkpoint, config, input, and output paths.

### 3. Catalog Search

Catalog data is loaded from configured metadata and asset roots. The API exposes filterable product results to the frontend without coupling the UI to local filesystem paths.

### 4. Recommendation Retrieval

The recommendation workflow uses precomputed visual embeddings and nearest-neighbor retrieval. Attribute filters and reranking can be applied to improve relevance after the initial visual similarity search.

### 5. Styling Personalization

Color-analysis notebooks explore face/skin segmentation, skin-mask generation, dominant RGB extraction, and seasonal palette mapping for personalized styling recommendations.

## Project Structure

```text
fashion-vton/
├── backend/
│   ├── requirements.txt
│   └── vton_api/
│       ├── app.py
│       ├── config.py
│       ├── routes/
│       │   ├── catalog.py
│       │   └── tryon.py
│       └── services/
│           ├── recommendations.py
│           ├── scw_vton.py
│           └── segmind.py
├── website/
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── config/
│       ├── lib/
│       └── pages/
├── SCW-VTON/
├── openpose/
├── fashion-recommendation-system/
├── color_analysis.ipynb
├── product_generation.ipynb
├── flask_scwvton.py
└── README.md
```

## Getting Started

### Backend Setup

```bash
cd fashion-vton
python -m pip install -r backend/requirements.txt
python -m backend.vton_api.wsgi
```

The backend starts the Flask API used by the frontend and legacy compatibility wrappers.

### Frontend Setup

```bash
cd fashion-vton/website
npm install
VITE_BACKEND_URL=http://localhost:5002 npm run dev
```

## Configuration

Runtime behavior is controlled through environment variables instead of hardcoded local paths.

### SCW-VTON

- `SCW_VTON_ROOT`: Root directory for the SCW-VTON implementation.
- `SCW_VTON_DATA_ROOT`: Dataset root used by SCW-VTON.
- `SCW_VTON_CKPT_DIR`: Directory containing SCW-VTON checkpoints.
- `SCW_VTON_CONFIG`: Model config path.
- `SCW_VTON_DEVICE`: Optional device override such as `cuda` or `cpu`.
- `SCW_VTON_VGG_CKPT`: Optional VGG checkpoint path used by perceptual components.

### Dataset and Outputs

- `VTON_DATASET_IMAGE_DIRS`: Comma-separated person image directories.
- `VTON_DATASET_CLOTH_DIRS`: Comma-separated clothing image directories.
- `VTON_OUTPUT_DIR`: Output directory for generated try-on images.

### External Services

- `SEGMIND_API_KEY`: API key for Segmind integrations.
- `SEGMIND_TRYON_URL`: Hosted try-on endpoint.
- `SEGMIND_360_VIDEO_URL`: Hosted 360-degree video endpoint.
- `OPENAI_API_KEY`: Backend-only key for search parsing.
- `OPENAI_MODEL`: Model name used for backend search parsing.

### Recommendation and Catalog

- `RECOMMENDER_METADATA_PATH`: Product metadata file.
- `RECOMMENDER_EMBEDDINGS_PATH`: Precomputed visual embedding file.
- `RECOMMENDER_FILENAMES_PATH`: Filename index for embeddings.
- `CATALOG_IMAGE_BASE_URL`: Base URL or path for product images.
- `CATALOG_CLOTH_BASE_URL`: Base URL or path for cloth assets.

## API Surface

Primary backend routes:

- `GET /api/catalog`: Returns catalog products and available filters.
- `GET /api/recommendations/similar`: Retrieves visually similar products.
- `POST /api/tryon`: Runs a configured try-on request.
- `POST /api/search/parse`: Converts natural-language search into structured filters.
- `POST /api/video/360`: Starts 360-degree generation through the configured provider.
- `GET /api/video/360/<job_id>`: Polls 360-degree generation status.
- `GET /output/<filename>`: Serves generated try-on output files.

Legacy compatibility routes are retained where useful for older scripts.

## Technical Highlights

- Modular Flask backend with service boundaries for model execution, catalog search, recommendations, and external APIs.
- Frontend/backend separation through API configuration rather than direct filesystem or model coupling.
- No browser-side exposure of OpenAI or Segmind credentials.
- Configurable SCW-VTON checkpoints, dataset roots, generated output paths, and catalog asset roots.
- Research code preserved separately from application runtime code for clearer maintainability.
- Resume-aligned scope covering virtual try-on, 360-degree generation hooks, color analysis, visual embeddings, k-NN retrieval, reranking, and hard-filtered catalog search.

## Repository Notes

This repository does not include large model checkpoints, private catalog assets, embedding pickle files, or full dataset directories. Those artifacts are intentionally externalized through configuration so the same codebase can run with local, cloud-mounted, or production-hosted data.

SCW-VTON and OpenPose are third-party research/vendor components. Their original license terms and notices should be preserved when redistributing or deploying this project.

## License

The application code in this repository can be released under the MIT License. Third-party model and research folders retain their respective upstream licenses and notices.
