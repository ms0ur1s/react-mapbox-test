import React, { useState, useRef, useCallback } from "react";
import useSwr from "swr";
import Map, { Marker, useMap } from "react-map-gl";
import useSupercluster from "use-supercluster";
import "mapbox-gl/dist/mapbox-gl.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import styles from "./styles.module.css";

const fetcher = (...args) => fetch(...args).then((response) => response.json());
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapReactMapGL2 = () => {
  const [viewState, setViewState] = useState({
    latitude: 52.6376,
    longitude: -1.135171,
    zoom: 12,
  });

  const mapRef = useRef();

  const url =
    "https://data.police.uk/api/crimes-street/all-crime?lat=52.629729&lng=-1.131592&date=2022-01";
  const { data, error } = useSwr(url, { fetcher });
  const crimes = data && !error ? data.slice(0, 2000) : [];
  const points = crimes.map((crime) => ({
    type: "Feature",
    properties: { cluster: false, crimeId: crime.id, category: crime.category },
    geometry: {
      type: "Point",
      coordinates: [
        parseFloat(crime.location.longitude),
        parseFloat(crime.location.latitude),
      ],
    },
  }));

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  return (
    <Map
      {...viewState}
      maxZoom={20}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: "100vw", height: "100vh" }}
      onMove={onMove}
      ref={mapRef}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      renderWorldCopies={false}
    >
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } =
          cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              latitude={latitude}
              longitude={longitude}
            >
              <div
                className={styles.clusterMarker}
                style={{
                  width: `${10 + (pointCount / points.length) * 20}px`,
                  height: `${10 + (pointCount / points.length) * 20}px`,
                }}
                onClick={() => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id),
                    20
                  );

                  setViewState({
                    ...viewState,
                    latitude,
                    longitude,
                    zoom: expansionZoom,
                    transitionDuration: "auto",
                  });
                }}
              >
                {pointCount}
              </div>
            </Marker>
          );
        }

        return (
          <Marker
            key={`crime-${cluster.properties.crimeId}`}
            latitude={latitude}
            longitude={longitude}
          >
            {/* <button className="crime-marker">
              <img
                src="https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png"
                alt="crime doesn't pay"
              />
            </button> */}
            <span className={styles.markerIcon}>
              <FontAwesomeIcon icon={faLocationDot} />
            </span>
          </Marker>
        );
      })}
    </Map>
  );
};

export default MapReactMapGL2;
