## 🚀 Key Technologies & Methods

### 🛰️ Google Earth Engine
Used Google Earth Engine for large-scale geospatial data preparation, environmental feature extraction, raster generation, and final landslide-risk visualization.

### 🌍 Environmental & Geospatial Data
The model uses six environmental predictors:

- **Elevation** — SRTM
- **Slope** — derived from SRTM DEM
- **Rainfall** — CHIRPS Daily
- **NDVI** — MODIS MOD13Q1
- **Soil Clay Content** — SoilGrids
- **Land Cover** — ESA WorldCover

### 📍 Historical Landslide Inventory
Historical landslide locations from the **GSI landslide inventory** were used as positive samples for supervised machine learning.

Representative background samples were also generated across Assam to create the non-landslide class.

### 🤖 Machine Learning
Two tree-based ensemble classification approaches were implemented and evaluated:

- **Random Forest**
- **XGBoost**

Random Forest was used as a strong baseline, while XGBoost was evaluated for its ability to model complex nonlinear relationships and feature interactions in environmental tabular data.

### 📊 Spatial Model Validation
Instead of relying only on a conventional random train-test split, **GroupShuffleSplit** was used with geographic grid groups.

This helps reduce spatial data leakage and evaluates the model on geographically separated areas.

### 🎯 Probability-Based Risk Classification
The final XGBoost model generates a landslide probability for each location.

A validation-based probability threshold of **0.40** was selected for binary landslide classification.

Current risk categories:

| Probability | Risk Level |
|---|---|
| < 0.20 | Low |
| 0.20 – < 0.40 | Medium |
| 0.40 – < 0.70 | High |
| ≥ 0.70 | Very High |

### 🗺️ Pixel-wise Spatial Prediction
The trained XGBoost model is applied to a multi-band environmental raster covering Assam.

Each pixel contains the six environmental features and receives an individual landslide probability from the trained model.

### 📦 GeoTIFF Prediction Output
The final spatial prediction is exported as:

`Assam_XGBoost_Landslide_Probability.tif`

This GeoTIFF stores pixel-wise XGBoost landslide probabilities and can be visualized in GIS platforms or uploaded to Google Earth Engine.

### 🔗 Google Earth Engine Integration
The generated XGBoost prediction raster is uploaded to Google Earth Engine for interactive spatial visualization along with historical landslide locations and risk-level points.

### 💾 Model Deployment
The trained XGBoost model is saved separately as:

`assam_landslide_xgb_model.json`

This model artifact can be loaded by a Python backend for future API-based prediction.

---

## 🧠 Core ML Pipeline

```text
GSI Historical Landslides
          +
GEE Environmental Data
          ↓
6 Environmental Features
          ↓
Positive + Background Samples
          ↓
Data Cleaning
          ↓
Spatial Train/Test Split
          ↓
Random Forest + XGBoost
          ↓
Spatial Validation
          ↓
Final XGBoost Model
          ↓
Pixel-wise Assam Prediction
          ↓
Landslide Probability
          ↓
GeoTIFF
          ↓
Google Earth Engine Visualization
