// =====================================================
// 1. ASSAM BOUNDARY
// =====================================================

var states = ee.FeatureCollection(
  'FAO/GAUL/2015/level1'
);

var assam = states.filter(
  ee.Filter.eq('ADM1_NAME', 'Assam')
);

Map.centerObject(assam, 7);

Map.addLayer(
  assam.style({
    color: '0000FF',
    fillColor: '00000000',
    width: 2
  }),
  {},
  'Assam Boundary'
);


// =====================================================
// 2. ENVIRONMENTAL PREDICTORS
// =====================================================

var dem = ee.Image(
  'USGS/SRTMGL1_003'
)
.clip(assam)
.rename('Elevation');


var slope = ee.Terrain.slope(dem)
.rename('Slope');


var rainfall = ee.ImageCollection(
  'UCSB-CHG/CHIRPS/DAILY'
)
.filterDate(
  '2024-01-01',
  '2025-01-01'
)
.select('precipitation')
.mean()
.clip(assam)
.rename('Rainfall');


var ndvi = ee.ImageCollection(
  'MODIS/061/MOD13Q1'
)
.filterDate(
  '2024-01-01',
  '2025-01-01'
)
.select('NDVI')
.mean()
.multiply(0.0001)
.clip(assam)
.rename('NDVI');


var soil = ee.Image(
  'projects/soilgrids-isric/clay_mean'
)
.select('clay_0-5cm_mean')
.clip(assam)
.rename('SoilClay');


var landcover = ee.Image(
  'ESA/WorldCover/v100/2020'
)
.clip(assam)
.rename('LandCover');


var predictors = dem
.addBands(slope)
.addBands(rainfall)
.addBands(ndvi)
.addBands(soil)
.addBands(landcover);

print(
  'Predictor Image:',
  predictors
);


// =====================================================
// 3. ACTUAL GSI ASSAM LANDSLIDES
// =====================================================

var raw_landslides = ee.FeatureCollection(
  'projects/spheric-gasket-507711-f8/assets/assam_report_GEE'
);


var assam_landslides = raw_landslides
.filter(
  ee.Filter.eq('State', 'Assam')
)
.filter(
  ee.Filter.notNull([
    'Latitude',
    'Longitude'
  ])
);


var landslides = assam_landslides.map(
  function(feature) {

    var lat = ee.Number.parse(
      ee.String(
        feature.get('Latitude')
      )
    );

    var lon = ee.Number.parse(
      ee.String(
        feature.get('Longitude')
      )
    );

    return ee.Feature(
      ee.Geometry.Point([
        lon,
        lat
      ]),
      feature.toDictionary()
    );
  }
);


landslides = landslides.filterBounds(
  assam
);


print(
  'Actual Assam GSI Landslides:',
  landslides.size()
);


// Actual GSI points = BLUE
Map.addLayer(
  landslides,
  {
    color: '0000FF',
    pointSize: 5
  },
  'Actual GSI Landslides'
);


// =====================================================
// 4. PYTHON XGBOOST PROBABILITY RASTER
// =====================================================

// This is the output created by your trained
// Python XGBoost model.

var xgb_probability = ee.Image(
  'projects/spheric-gasket-507711-f8/assets/Assam_XGBoost_Landslide_Probability'
);

print(
  'Python XGBoost Probability Raster:',
  xgb_probability
);


// =====================================================
// 5. CREATE RISK CLASSES
// =====================================================

// 1 = Low
// 2 = Medium
// 3 = High
// 4 = Very High

var risk_class = xgb_probability
  .where(
    xgb_probability.lt(0.20),
    1
  )
  .where(
    xgb_probability.gte(0.20)
      .and(
        xgb_probability.lt(0.40)
      ),
    2
  )
  .where(
    xgb_probability.gte(0.40)
      .and(
        xgb_probability.lt(0.70)
      ),
    3
  )
  .where(
    xgb_probability.gte(0.70),
    4
  )
  .rename('Risk')
  .toInt();


// =====================================================
// 6. GET PREDICTED RISK LOCATIONS AS POINTS
// =====================================================

var predicted_points = risk_class.stratifiedSample({

  numPoints: 1000,

  classBand: 'Risk',

  region: assam.geometry(),

  scale: 100,

  classValues: [
    1,
    2,
    3,
    4
  ],

  classPoints: [
    250,
    250,
    250,
    250
  ],

  geometries: true,

  seed: 42,

  tileScale: 4

});


print(
  'Total XGBoost Predicted Points:',
  predicted_points.size()
);


// =====================================================
// 7. SEPARATE PREDICTED RISK POINTS
// =====================================================

var predicted_low =
  predicted_points.filter(
    ee.Filter.eq('Risk', 1)
  );


var predicted_medium =
  predicted_points.filter(
    ee.Filter.eq('Risk', 2)
  );


var predicted_high =
  predicted_points.filter(
    ee.Filter.eq('Risk', 3)
  );


var predicted_very_high =
  predicted_points.filter(
    ee.Filter.eq('Risk', 4)
  );


// =====================================================
// 8. DISPLAY ONLY POINTS
// =====================================================

// LOW = GREEN
Map.addLayer(
  predicted_low,
  {
    color: '00FF00',
    pointSize: 4
  },
  'XGBoost Predicted - Low'
);


// MEDIUM = YELLOW
Map.addLayer(
  predicted_medium,
  {
    color: 'FFFF00',
    pointSize: 4
  },
  'XGBoost Predicted - Medium'
);


// HIGH = ORANGE
Map.addLayer(
  predicted_high,
  {
    color: 'FFA500',
    pointSize: 5
  },
  'XGBoost Predicted - High'
);


// VERY HIGH = RED
Map.addLayer(
  predicted_very_high,
  {
    color: 'FF0000',
    pointSize: 6
  },
  'XGBoost Predicted - Very High'
);


// =====================================================
// 9. COUNTS
// =====================================================

print(
  'Low Risk Points:',
  predicted_low.size()
);

print(
  'Medium Risk Points:',
  predicted_medium.size()
);

print(
  'High Risk Points:',
  predicted_high.size()
);

print(
  'Very High Risk Points:',
  predicted_very_high.size()
);


// =====================================================
// 10. FINAL MAP
// =====================================================

Map.centerObject(
  assam,
  7
);// =====================================================
// 1. ASSAM BOUNDARY
// =====================================================

var states = ee.FeatureCollection(
  'FAO/GAUL/2015/level1'
);

var assam = states.filter(
  ee.Filter.eq('ADM1_NAME', 'Assam')
);

Map.centerObject(assam, 7);

Map.addLayer(
  assam.style({
    color: '0000FF',
    fillColor: '00000000',
    width: 2
  }),
  {},
  'Assam Boundary'
);


// =====================================================
// 2. ENVIRONMENTAL PREDICTORS
// =====================================================

var dem = ee.Image(
  'USGS/SRTMGL1_003'
)
.clip(assam)
.rename('Elevation');


var slope = ee.Terrain.slope(dem)
.rename('Slope');


var rainfall = ee.ImageCollection(
  'UCSB-CHG/CHIRPS/DAILY'
)
.filterDate(
  '2024-01-01',
  '2025-01-01'
)
.select('precipitation')
.mean()
.clip(assam)
.rename('Rainfall');


var ndvi = ee.ImageCollection(
  'MODIS/061/MOD13Q1'
)
.filterDate(
  '2024-01-01',
  '2025-01-01'
)
.select('NDVI')
.mean()
.multiply(0.0001)
.clip(assam)
.rename('NDVI');


var soil = ee.Image(
  'projects/soilgrids-isric/clay_mean'
)
.select('clay_0-5cm_mean')
.clip(assam)
.rename('SoilClay');


var landcover = ee.Image(
  'ESA/WorldCover/v100/2020'
)
.clip(assam)
.rename('LandCover');


var predictors = dem
.addBands(slope)
.addBands(rainfall)
.addBands(ndvi)
.addBands(soil)
.addBands(landcover);

print(
  'Predictor Image:',
  predictors
);


// =====================================================
// 3. ACTUAL GSI ASSAM LANDSLIDES
// =====================================================

var raw_landslides = ee.FeatureCollection(
  'projects/spheric-gasket-507711-f8/assets/assam_report_GEE'
);


var assam_landslides = raw_landslides
.filter(
  ee.Filter.eq('State', 'Assam')
)
.filter(
  ee.Filter.notNull([
    'Latitude',
    'Longitude'
  ])
);


var landslides = assam_landslides.map(
  function(feature) {

    var lat = ee.Number.parse(
      ee.String(
        feature.get('Latitude')
      )
    );

    var lon = ee.Number.parse(
      ee.String(
        feature.get('Longitude')
      )
    );

    return ee.Feature(
      ee.Geometry.Point([
        lon,
        lat
      ]),
      feature.toDictionary()
    );
  }
);


landslides = landslides.filterBounds(
  assam
);


print(
  'Actual Assam GSI Landslides:',
  landslides.size()
);


// Actual GSI points = BLUE
Map.addLayer(
  landslides,
  {
    color: '0000FF',
    pointSize: 5
  },
  'Actual GSI Landslides'
);


// =====================================================
// 4. PYTHON XGBOOST PROBABILITY RASTER
// =====================================================

// This is the output created by your trained
// Python XGBoost model.

var xgb_probability = ee.Image(
  'projects/spheric-gasket-507711-f8/assets/Assam_XGBoost_Landslide_Probability'
);

print(
  'Python XGBoost Probability Raster:',
  xgb_probability
);


// =====================================================
// 5. CREATE RISK CLASSES
// =====================================================

// 1 = Low
// 2 = Medium
// 3 = High
// 4 = Very High

var risk_class = xgb_probability
  .where(
    xgb_probability.lt(0.20),
    1
  )
  .where(
    xgb_probability.gte(0.20)
      .and(
        xgb_probability.lt(0.40)
      ),
    2
  )
  .where(
    xgb_probability.gte(0.40)
      .and(
        xgb_probability.lt(0.70)
      ),
    3
  )
  .where(
    xgb_probability.gte(0.70),
    4
  )
  .rename('Risk')
  .toInt();


// =====================================================
// 6. GET PREDICTED RISK LOCATIONS AS POINTS
// =====================================================

var predicted_points = risk_class.stratifiedSample({

  numPoints: 1000,

  classBand: 'Risk',

  region: assam.geometry(),

  scale: 100,

  classValues: [
    1,
    2,
    3,
    4
  ],

  classPoints: [
    250,
    250,
    250,
    250
  ],

  geometries: true,

  seed: 42,

  tileScale: 4

});


print(
  'Total XGBoost Predicted Points:',
  predicted_points.size()
);


// =====================================================
// 7. SEPARATE PREDICTED RISK POINTS
// =====================================================

var predicted_low =
  predicted_points.filter(
    ee.Filter.eq('Risk', 1)
  );


var predicted_medium =
  predicted_points.filter(
    ee.Filter.eq('Risk', 2)
  );


var predicted_high =
  predicted_points.filter(
    ee.Filter.eq('Risk', 3)
  );


var predicted_very_high =
  predicted_points.filter(
    ee.Filter.eq('Risk', 4)
  );


// =====================================================
// 8. DISPLAY ONLY POINTS
// =====================================================

// LOW = GREEN
Map.addLayer(
  predicted_low,
  {
    color: '00FF00',
    pointSize: 4
  },
  'XGBoost Predicted - Low'
);


// MEDIUM = YELLOW
Map.addLayer(
  predicted_medium,
  {
    color: 'FFFF00',
    pointSize: 4
  },
  'XGBoost Predicted - Medium'
);


// HIGH = ORANGE
Map.addLayer(
  predicted_high,
  {
    color: 'FFA500',
    pointSize: 5
  },
  'XGBoost Predicted - High'
);


// VERY HIGH = RED
Map.addLayer(
  predicted_very_high,
  {
    color: 'FF0000',
    pointSize: 6
  },
  'XGBoost Predicted - Very High'
);


// =====================================================
// 9. COUNTS
// =====================================================

print(
  'Low Risk Points:',
  predicted_low.size()
);

print(
  'Medium Risk Points:',
  predicted_medium.size()
);

print(
  'High Risk Points:',
  predicted_high.size()
);

print(
  'Very High Risk Points:',
  predicted_very_high.size()
);


// =====================================================
// 10. FINAL MAP
// =====================================================

Map.centerObject(
  assam,
  7
);