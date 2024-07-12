import React, { useState, useEffect, useRef } from "react";
import { Map, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN; // Set your mapbox token here

const ReactMapGLTest = () => {
  const mapRef = useRef(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [zoom, setZoom] = useState(1.45);

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

  const onClick = (event) => {
    if (!event.features || event.features.length === 0) {
      return;
    }

    const feature = event.features[0];
    const clusterId = feature.properties.cluster_id;

    const mapboxSource = mapRef.current.getSource("earthquakes");

    mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) {
        return;
      }

      mapRef.current.easeTo({
        center: feature.geometry.coordinates,
        zoom,
        duration: 500,
      });
    });
  };

  const onZoom = (event) => {
    const newZoom = event.viewState.zoom;
    setZoom(newZoom);
    console.log("Current zoom level:", newZoom);
  };

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
    <>
      <Map
        initialViewState={{
          latitude: 20,
          longitude: -20,
          zoom: 1.6,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={[clusterLayer.id]}
        onClick={onClick}
        onZoom={onZoom}
        ref={mapRef}
        style={{ width: "100vw", height: "100vh", position: "fixed" }}
        minZoom={1.6} // Set the minimum zoom level
        maxZoom={15} // Set the maximum zoom level
        minPitch={0} // Set the minimum pitch
        maxPitch={60} // Set the maximum pitch
        maxBounds={[
          [-180, -90], // Southwest coordinates
          [180, 90], // Northeast coordinates
        ]}
        renderWorldCopies={false}
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
      </Map>
    </>
  );
};

export default ReactMapGLTest;
