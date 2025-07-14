# Fashion VTON

Virtual try-on and fashion recommendation workspace built around SCW-VTON shape-aware warping, OpenPose-derived pose inputs, catalog search, and a React dashboard.

## Structure

- `backend/vton_api/` contains the Flask API, configuration, try-on orchestration, Segmind integration, catalog metadata, recommendation search, and search parsing.
- `website/` contains the Vite React frontend. It calls the backend through `VITE_BACKEND_URL`.
- `SCW-VTON/` and `openpose/` are research/vendor implementations used by the pipeline.
- `fashion-recommendation-system/` keeps the embedding build and Streamlit exploration scripts.
- `color_analysis.ipynb` and `product_generation.ipynb` are exploratory notebooks from the color/product generation branch.

## Backend

```bash
cd /Users/kushalkhemka/Desktop/vton
python -m pip install -r backend/requirements.txt
python -m backend.vton_api.wsgi
```

Important environment variables:

- `SCW_VTON_ROOT`, `SCW_VTON_DATA_ROOT`, `SCW_VTON_CKPT_DIR`, `SCW_VTON_CONFIG`
- `VTON_DATASET_IMAGE_DIRS`, `VTON_DATASET_CLOTH_DIRS`, `VTON_OUTPUT_DIR`
- `SEGMIND_API_KEY`, `SEGMIND_TRYON_URL`, `SEGMIND_360_VIDEO_URL`
- `RECOMMENDER_METADATA_PATH`, `RECOMMENDER_EMBEDDINGS_PATH`, `RECOMMENDER_FILENAMES_PATH`
- `CATALOG_IMAGE_BASE_URL`, `CATALOG_CLOTH_BASE_URL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`

## Frontend

```bash
cd /Users/kushalkhemka/Desktop/vton/website
npm install
VITE_BACKEND_URL=http://localhost:5002 npm run dev
```

## Notes

The repo does not currently include SCW checkpoints, recommender embedding pickles, or a complete public catalog image/cloth asset directory. Those paths are configuration-driven so local, cloud, or mounted data can be swapped without code changes.
