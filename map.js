function updateMap(map, page15Url) {
  var customIcon = L.icon({
    iconUrl: "https://apex.oracle.com/pls/apex/r/my_laboratory/54304/files/static/v8/main_marker.jpg",
    iconSize: [25, 41], 
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34], 
    shadowUrl: null 
  });

  let selectedPolyline = null; // To track the currently selected polyline
  let selectedMarker = null; // To track the currently selected marker

  function updateBusPaths() {
    apex.server.process("callback_proc", null, {
      success: function (pData) {
        if (pData.success) {
          // Remove all markers and polylines except the selected polyline
          map.eachLayer(function (layer) {
            if (
              (layer instanceof L.Marker && layer !== selectedMarker) || 
              (layer instanceof L.Polyline && layer !== selectedPolyline)
            ) {
              map.removeLayer(layer);
            }
          });

          // Update bus paths and markers
          pData.bus_paths.forEach(function (bus) {
            var pathCoordinates = [];
            var lastStatusLocation = null;

            bus.path.forEach(function (location) {
              pathCoordinates.push([location.latitude, location.longitude]);
              if (location.is_last_status === 1) {
                lastStatusLocation = location;
              }
            });

            if (lastStatusLocation) {
              // Check if the selected marker belongs to this bus
              if (
                selectedMarker &&
                selectedMarker.getPopup().getContent().includes(`Bus ID:</b> ${bus.bus_id}`)
              ) {
                // Update selected marker's position and popup
                selectedMarker.setLatLng([
                  lastStatusLocation.latitude,
                  lastStatusLocation.longitude,
                ]);
                selectedMarker.setPopupContent(
                  `<b>Bus ID:</b> ${bus.bus_id}<br><b>Last Status:</b> ${lastStatusLocation.timestamp}`
                );

                // Update selected polyline
                if (selectedPolyline) {
                  selectedPolyline.setLatLngs(pathCoordinates);
                }
              } else {
                // Create a new marker for other buses
                var marker = L.marker(
                  [lastStatusLocation.latitude, lastStatusLocation.longitude],
                  { icon: customIcon }
                )
                  .addTo(map)
                  .bindPopup(
                    `<b>Bus ID:</b> ${bus.bus_id}<br><b>Last Status:</b> ${lastStatusLocation.timestamp}`
                  );

                // Add click event to handle selection
                marker.on("click", function () {
                  if (selectedPolyline) {
                    map.removeLayer(selectedPolyline); // Clear previous polyline
                    selectedPolyline = null;
                  }

                  // Add the new polyline
                  selectedPolyline = L.polyline(pathCoordinates, {
                    color: "blue",
                    weight: 3,
                    opacity: 0.7,
                  }).addTo(map);

                  selectedPolyline.bindPopup(`<b>Bus ID:</b> ${bus.bus_id}`);

                  // Update the selected marker
                  selectedMarker = marker;

                  // Redirect to the bus URL if needed
                  window.location.href = bus.url;
                });
              }
            }
          });
        } else {
          console.error("Unexpected response format.");
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error("Error occurred: " + textStatus + ", " + errorThrown);
      },
    });
  }

  // Clear selected route when clicking on the map
  map.on("click", function () {
    if (selectedPolyline) {
      map.removeLayer(selectedPolyline);
      selectedPolyline = null;
    }
    selectedMarker = null;
  });

  updateBusPaths();
  setInterval(updateBusPaths, 5000);
}
