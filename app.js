const mapStyle = [{
	"featureType": "administrative.country",
	"elementType": "labels",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "administrative.land_parcel",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "administrative.locality",
	"elementType": "labels",
	"stylers": [{
		"lightness": 55
	},
	{
		"visibility": "simplified"
	},
	{
		"weight": 2
	}
	]
},
{
	"featureType": "administrative.locality",
	"elementType": "geometry",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "administrative.neighborhood",
	"stylers": [{
		"saturation": 5
	},
	{
		"visibility": "off"
	}
	]
},
{
	"featureType": "administrative.neighborhood",
	"elementType": "labels",
	"stylers": [{
		"lightness": 5
	}]
},
{
	"featureType": "administrative.province",
	"elementType": "labels",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "landscape.man_made",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "landscape.natural",
	"stylers": [{
		"saturation": -10
	},
	{
		"lightness": 5
	},
	{
		"weight": 5
	}
	]
},
{
	"featureType": "landscape.natural",
	"elementType": "labels",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "landscape.natural.landcover",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "poi",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "poi.attraction",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "poi.business",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "poi.government",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "poi.medical",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "road.highway",
	"stylers": [{
		"saturation": 20
	},
	{
		"lightness": 25
	},
	{
		"visibility": "simplified"
	}
	]
},
{
	"featureType": "road.local",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "transit",
	"stylers": [{
		"visibility": "off"
	}]
},
{
	"featureType": "water",
	"stylers": [{
		"lightness": 45
	}]
}
];

// Escape HTML characters in a template literal string to prevent XSS.
function sanitizeHTML(strings) {
	const entities = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#39;'
	};
	let result = strings[0];
	for (let i = 1; i < arguments.length; i++) {
		result += String(arguments[i]).replace(/[&<>'"]/g, (char) => {
			return entities[char];
		});
		result += strings[i];
	}
	return result;
}

const showDist = [];
var precinct;
var map;
// Initialize the map.

function initMap() {

	// Create the map.
	 map = new google.maps.Map(document.getElementById('map'), {
		zoom: 11,
		center: {
			lat: 32.252,
			lng: -110.947
		},
		styles: mapStyle,
		disableDefaultUI: true,
		options: {
			gestureHandling: 'greedy'
		}
	});

	// Load congressional districts onto map
	map.data.loadGeoJson('cong_dist.json', {});

	// Load legislative districts onto map
	map.data.loadGeoJson('leg_dist.json', {});

	// Load Pima County supervisor districts onto map
	map.data.loadGeoJson('sup_dist.json', {});

	// Load City of Tucson wards onto map
	map.data.loadGeoJson('wards.json', {});

	// Load other incorporated jurisdictions onto map
	map.data.loadGeoJson('incorp.json', {});

	// Load school districts onto map
	map.data.loadGeoJson('sch_dist.json', {});

	// Load voting precincts onto map
	map.data.loadGeoJson('precincts.json', {});

	// Hide districts on map
	map.data.setStyle({
		fillColor: "none",
		fillOpacity: 0,
		strokeOpacity: 0
	});


	// Define API key
	const apiKey = 'AIzaSyA09BCz4Abyu7GMF_jnLa7Ds1N9iRbxAnI';

	const infoWindow = new google.maps.InfoWindow();

	// Build and add the search bar
	const card = document.createElement('div');
	const titleBar = document.createElement('div');
	const title = document.createElement('div');
	const container = document.createElement('div');
	const input = document.createElement('input');
	const options = {
		types: ['address'],
		componentRestrictions: {
			country: 'us'
		},
	};

	card.setAttribute('id', 'pac-card');
	title.setAttribute('id', 'title');
	title.textContent = 'Pima County Voting District Finder';
	titleBar.appendChild(title);
	container.setAttribute('id', 'pac-container');
	input.setAttribute('id', 'pac-input');
	input.setAttribute('type', 'text');
	input.setAttribute('placeholder', 'Enter your address');
	container.appendChild(input);
	card.appendChild(titleBar);
	card.appendChild(container);
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

	// Make the search bar into a Places Autocomplete search bar and select
	// which detail fields should be returned about the place that
	// the user selects from the suggestions.

	const autocomplete = new google.maps.places.Autocomplete(input, options);

	autocomplete.setFields(
		['address_components', 'geometry', 'name']);

	// Set marker when the user selects an address
	const originMarker = new google.maps.Marker({
		map: map,
		icon: "./img/locator.png",
	});

	originMarker.setVisible(false);
	let originLocation = map.getCenter();

	autocomplete.addListener('place_changed', (event) => {
		originMarker.setVisible(false);
		originLocation = map.getCenter();
		const place = autocomplete.getPlace();

		if (!place.geometry) {
			// User entered the name of a Place that was not suggested and
			// pressed the Enter key, or the Place Details request failed.
			window.alert('No address available for input: \'' + place.name + '\'');
			return;
		}

		// Recenter the map to the selected address
		originLocation = place.geometry.location;

		map.setCenter(originLocation);
		map.setZoom(13);
		map.data.revertStyle();
		const streetAddress = (place.name);
		const originLoc = place.geometry.location;

		originMarker.setPosition(originLocation);
		originMarker.setVisible(true);

		// Zero out selected districts from previous search
		ward = [];
		sup_dist = [];
		cong_dist = [];
		leg_dist = [];
		incorp = [];
		sch_dist = [];

		map.data.forEach(function (feature) {

			// Find City of Tucson Ward
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'ward') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						ward = feature.getProperty("WARD");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'ward') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					ward = feature.getProperty("WARD");

				}
			}

			// Find county supervisor district
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'sup_dist') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						sup_dist = feature.getProperty("SUP_DIST");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'sup_dist') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					sup_dist = feature.getProperty("SUP_DIST");

				}
			}

			// Find congressional district
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'cong_dist') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						cong_dist = feature.getProperty("CONG_DIST");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'cong_dist') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					cong_dist = feature.getProperty("CONG_DIST");

				}
			}

			// Find legislative district
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'leg_dist') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						leg_dist = feature.getProperty("LEG_DIST");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'leg_dist') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					leg_dist = feature.getProperty("LEG_DIST");

				}
			}

			// Find incorporated areas other than Tucson
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'incorp') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						incorp = feature.getProperty("INCORP");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'incorp') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					incorp = feature.getProperty("INCORP");

				}
			}

			// Find school district
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'sch_dist') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						sch_dist = feature.getProperty("SCH_DIST");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'sch_dist') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					sch_dist = feature.getProperty("SCH_DIST");

				}
			}

			// Find voting precinct
			if (feature.getGeometry().getType() === 'MultiPolygon' && feature.getProperty("TYPE") == 'precinct') {
				var array = feature.getGeometry().getArray();
				array.forEach(function (item, i) {

					var coords = item.getAt(0).getArray();
					var multiPoly = new google.maps.Polygon({
						paths: coords
					});
					var isInside = google.maps.geometry.poly.containsLocation(originLocation, multiPoly);

					if (isInside) {
						precinct = feature.getProperty("PRECINCT");
					}

				});
			} else if (feature.getGeometry().getType() === 'Polygon' && feature.getProperty("TYPE") == 'precinct') {
				var polyPath = feature.getGeometry().getAt(0).getArray();

				var poly = new google.maps.Polygon({
					paths: polyPath
				});
				var isInsidePoly = google.maps.geometry.poly.containsLocation(originLocation, poly);

				if (isInsidePoly) {
					precinct = feature.getProperty("PRECINCT");

				}
			}

		});

		// Build our pop-up info
		if (sup_dist > 0 && sup_dist < 6) {
			countyCheck = `<p><b>Your districts:</b></p>`;
		} else {
			countyCheck = `You do not vote in Pima County.`;
		}

		if (ward > 0 && ward < 7) {
			tucsonWard = `City of Tucson Ward ${ward}<br>`;
		} else {
			tucsonWard = []
		}

		if (sup_dist > 0 && sup_dist < 6) {
			pimaSup = `Pima Supervisor District ${sup_dist}<br>`;
		} else {
			pimaSup = []
		}

		if (cong_dist > 5 && cong_dist < 8) {
			congDist = `Congressional District ${cong_dist}<br>`;
		} else {
			congDist = []
		}

		if (leg_dist > 15 && leg_dist < 24) {
			legDist = `Legislative District ${leg_dist}<br>`;
		} else {
			legDist = []
		}

		if (incorp == "City of South Tucson" || incorp == "Town of Marana" || incorp == "Town of Sahuarita" || incorp == "Town of Oro Valley") {
			otherIncorp = `${incorp}<br>`;
		} else {
			otherIncorp = []
		}

		if (sch_dist) {
			schDist = `${sch_dist}<br>`;
		} else {
			schDist = []
		}

		if (precinct) {
			votingPrecinct = `<p><b>Your precinct: </b>${precinct}<br>`;
		} else {
			votingPrecinct = []
		}

		var content = `
			<div class="popup">
			<h2>${streetAddress}</h2>
			${votingPrecinct}
			${countyCheck}
			<a href="#" onclick="congLite('${cong_dist}')">${congDist}</a>
      <a href="#" onclick="legLite('${leg_dist}')">${legDist}</a>
			<a href="#" onclick="supLite('${sup_dist}')">${pimaSup}</a>
			<a href="#" onclick="wardLite('${ward}')">${tucsonWard}</a>
      <a href="#" onclick="incorpLite('${incorp}')">${otherIncorp}</a>
			<a href="#" onclick="schLite('${sch_dist}')">${schDist}</a>
			</div>
			`;

		infoWindow.setContent(content);
		infoWindow.setPosition(originLoc);
		infoWindow.setOptions({
			pixelOffset: new google.maps.Size(0, -30)
		});
		infoWindow.open(map);


		return;
	});

}

function congLite(cong_dist) {

	map.data.revertStyle();
	map.data.forEach(function (feature) {
		if (feature.getProperty("CONG_DIST") == cong_dist) {
			map.data.overrideStyle(feature, { 
				strokeOpacity: 1, 
				strokeWeight: 5,
				fillColor: '#BBBBBB',
				fillOpacity: .5
					});
		}
	});
	map.setZoom(10);
}

function legLite(leg_dist) {

  map.data.revertStyle();
	map.data.forEach(function (feature) {
		if (feature.getProperty("LEG_DIST") == leg_dist) {
			map.data.overrideStyle(feature, { 
				strokeOpacity: 1, 
				strokeWeight: 5,
				fillColor: '#BBBBBB',
				fillOpacity: .5
					});
		}
	});
	map.setZoom(12);
}

function supLite(sup_dist) {

  map.data.revertStyle();
	map.data.forEach(function (feature) {
		if (feature.getProperty("SUP_DIST") == sup_dist) {
			map.data.overrideStyle(feature, { 
				strokeOpacity: 1, 
				strokeWeight: 5,
				fillColor: '#BBBBBB',
				fillOpacity: .5
					});
		}
	});
	map.setZoom(11);

}

function wardLite(ward) {

  map.data.revertStyle();
	map.data.forEach(function (feature) {
		if (feature.getProperty("WARD") == ward) {
			map.data.overrideStyle(feature, { 
				strokeOpacity: 1, 
				strokeWeight: 5,
				fillColor: '#BBBBBB',
				fillOpacity: .5
					});
		}
	});
	map.setZoom(13);

}

function incorpLite(incorp) {

  map.data.revertStyle();
	map.data.forEach(function (feature) {
		if (feature.getProperty("INCORP") == incorp) {
			map.data.overrideStyle(feature, { strokeOpacity: 1, strokeWeight: 6 });
		}
	});
	map.setZoom(12);

}

function schLite(sch_dist) {

  map.data.revertStyle();
	map.data.forEach(function (feature) {
		if (feature.getProperty("SCH_DIST") == sch_dist) {
			map.data.overrideStyle(feature, { strokeOpacity: 1, strokeWeight: 6 });
		}
	});
	map.setZoom(12);

}
