import React, { useState, useEffect, useRef } from "react";
import ReactMapGL, { Map, Source, Layer, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./styles.module.css";

const MapboxMap = () => {
  const [viewport, setViewport] = useState({
    width: "100vw",
    height: "100vh",
    latitude: 15,
    longitude: 0,
    zoom: 1.4,
  });

  const [geojsonData, setGeojsonData] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const generateMarkers = (count) => {
    const minLat = -55,
      rangeLat = 125,
      rangeLng = 345,
      minLng = -170;

    const features = Array.from({ length: count }, (v, k) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          minLng + Math.random() * rangeLng,
          minLat + Math.random() * rangeLat,
        ],
      },
      properties: {
        mag: k,
      },
    }));

    return {
      type: "FeatureCollection",
      features,
    };
  };

  useEffect(() => {
    setGeojsonData(generateMarkers(500000));
  }, []);

  const clusterLayer = {
    id: "clusters",
    type: "circle",
    source: "earthquakes",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#51bbd6",
        100,
        "#f1f075",
        750,
        "#f28cb1",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    },
  };

  const clusterCountLayer = {
    id: "cluster-count",
    type: "symbol",
    source: "earthquakes",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  };

  const unclusteredPointLayer = {
    id: "unclustered-point",
    type: "symbol",
    source: "earthquakes",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": "custom-marker",
      "text-field": ["get", "title"],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 1.25],
      "text-anchor": "top",
    },
  };

  return (
    <div className={styles.mapContainerGL}>
      <ReactMapGL
        {...viewport}
        width="100vw"
        height="100vh"
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
        onViewportChange={(newViewport) => setViewport(newViewport)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        {geojsonData && (
          <Source
            id="earthquakes"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>
        )}

        {popupInfo && (
          <Popup
            tipSize={5}
            anchor="top"
            longitude={popupInfo.geometry.coordinates[0]}
            latitude={popupInfo.geometry.coordinates[1]}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
          >
            <div>
              Magnitude: {popupInfo.properties.mag}
              <br />
              Tsunami: {popupInfo.properties.tsunami ? "yes" : "no"}
            </div>
          </Popup>
        )}
      </ReactMapGL>
    </div>
  );
};

export default MapboxMap;
