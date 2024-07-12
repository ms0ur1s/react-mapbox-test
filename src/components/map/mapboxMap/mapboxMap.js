import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./styles.module.css";

const MapboxMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const generateMarkers = (count) => {
    const minLat = -55,
      rangeLat = 125,
      rangeLng = 345,
      minLng = -170;

    const features = Array.from({ length: count }, (v, k) => {
      return {
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
      };
    });
    return {
      type: "FeatureCollection",
      features,
    };
  };

  useEffect(() => {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [0, 15],
      zoom: 1.4,
      renderWorldCopies: false,
    });

    map.current.on("load", () => {
      map.current.loadImage(
        "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
        (error, image) => {
          if (error) throw error;
          map.current.addImage("custom-marker", image);

           const geojsonData = generateMarkers(500000);

          map.current.addSource("earthquakes", {
            type: "geojson",
            data: geojsonData, //'https://data-nces.opendata.arcgis.com/api/download/v1/items/5cd68dad64f641f6b847367493e92657/geojson?layers=3',
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
          });

          map.current.addLayer({
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
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40,
              ],
            },
          });

          map.current.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "earthquakes",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
          });

          map.current.addLayer({
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
          });

          map.current.on("click", "clusters", (e) => {
            const features = map.current.queryRenderedFeatures(e.point, {
              layers: ["clusters"],
            });
            const clusterId = features[0].properties.cluster_id;
            map.current
              .getSource("earthquakes")
              .getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;

                map.current.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom,
                });
              });
          });

          map.current.on("click", "unclustered-point", (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const mag = e.features[0].properties.mag;
            const tsunami =
              e.features[0].properties.tsunami === 1 ? "yes" : "no";

            // Ensure that if the map is zoomed out such that
            // multiple copies of the feature are visible, the
            // popup appears over the copy being pointed to.
            if (
              ["mercator", "equirectangular"].includes(
                map.current.getProjection().name
              )
            ) {
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`magnitude: ${mag}<br>Was there a tsunami?: ${tsunami}`)
              .addTo(map.current);
          });

          map.current.on("mouseenter", "clusters", () => {
            map.current.getCanvas().style.cursor = "pointer";
          });
          map.current.on("mouseleave", "clusters", () => {
            map.current.getCanvas().style.cursor = "";
          });
        }
      );
    });
  }, []);

  return <div ref={mapContainer} className={styles.mapContainer} />;
};

export default MapboxMap;
