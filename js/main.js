// main.js

// This file constructs the map and restaurant elements for the home page,
// while restaurant_info.js does the same for each specific restaurant.

// Globals
const favicon = document.querySelector("#favicon");
let cuisines;
let markers = [];
let neighborhoods;
let newMap;
let restaurants;

// Randomize favicon
favicon.href = `./img/favicon-${Math.floor(Math.random() * 9) + 1}.ico`;

// Initialize Leaflet map
initMap = () => {
	self.newMap = L.map("map", {
		attributionControl: false,
		center: [47.642, -122.335],
		doubleClickZoom: false,
		dragging: !L.Browser.mobile,
		scrollWheelZoom: false,
		zoom: 11,
	});

	L.tileLayer(
		"https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
		{
			attribution:
				'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: "mapbox/streets-v11",
			tileSize: 512,
			zoomOffset: -1,
			accessToken:
				"pk.eyJ1Ijoic2JheWVybiIsImEiOiJja3l1eXR2dmcxczllMm5vN3EzeHhsNHd2In0.Va3MhqBNOt_OnKKGJH4wIw",
		}
	).addTo(self.newMap);

	self.newMap.on("click", onClick);
	function onClick(e) {
		self.newMap.panTo(e.latlng);
		console.log("You clicked:" + e.latlng.toString());
	}

	updateRestaurants();
};

// Initialize Google map
// window.initMap = () => {
//   let loc = {
//     lat: 40.722216,
//     lng: -73.987501
//   };
//   self.map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 12,
//     center: loc,
//     scrollwheel: false
//   });
//   updateRestaurants();
// }

// Add Leaflet map markers
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach((restaurant) => {
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);

		marker.bindPopup(
			`<a href="${marker.options.url}">${marker.options.title}</a></br>
			<img src="${DBHelper.urlForRestaurantImage(restaurant)}"></img>`
		);
		marker.on("click", onClick);
		function onClick() {
			marker.openPopup();
		}

		self.markers.push(marker);
	});
};

// Add Google map markers
// addMarkersToMap = (restaurants = self.restaurants) => {
//   restaurants.forEach(restaurant => {
//     // Add marker to the map
//     const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
//     google.maps.event.addListener(marker, 'click', () => {
//       window.location.href = marker.url
//     });
//     self.markers.push(marker);
//   });
// }

// Create individual restaurant items
createRestaurantHTML = (restaurant) => {
	const li = document.createElement("li");

	const image = document.createElement("img");
	image.alt = `${restaurant.name}, ${restaurant.neighborhood}`;
	image.className = "restaurant-img";
	image.src = DBHelper.urlForRestaurantImage(restaurant);
	li.append(image);

	const name = document.createElement("h1");
	name.textContent = restaurant.name;
	li.append(name);

	const tags = document.createElement("div");
	const cuisine = document.createElement("p");
	const neighborhood = document.createElement("p");
	tags.classList.add("tags");
	cuisine.textContent = restaurant.cuisine_type;
	neighborhood.textContent = restaurant.neighborhood;
	tags.append(cuisine);
	tags.append(neighborhood);
	li.append(tags);

	const more = document.createElement("a");
	more.textContent = "View Details";
	more.href = DBHelper.urlForRestaurant(restaurant);
	more.className = "view-button";
	more.tabIndex = "3";
	more.setAttribute("role", "button");
	li.append(more);

	return li;
};

// Fetch ALL cuisines
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines.sort();
			fillCuisinesHTML();
		}
	});
};

// Fetch ALL neighborhoods
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) {
			// Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods.sort();
			fillNeighborhoodsHTML();
		}
	});
};

// Set individual cuisine HTML
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById("cuisines-select");

	cuisines.forEach((cuisine) => {
		const option = document.createElement("option");
		option.textContent = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

// Set individual neighborhood HTML
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById("neighborhoods-select");
	neighborhoods.forEach((neighborhood) => {
		const option = document.createElement("option");
		option.textContent = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

// Add restaurant info to page
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById("restaurants-list");
	restaurants.forEach((restaurant) => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
};

// Clear current restaurants from page and map
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById("restaurants-list");
	ul.textContent = "";

	// Remove all map markers
	if (self.markers) {
		self.markers.forEach((marker) => marker.remove());
	}
	self.markers = [];
	self.restaurants = restaurants.sort(sortByKey("name"));
};

// Sort (alphabetize) object by specified key
sortByKey = (key) => {
	return function (a, b) {
		return a[key].localeCompare(b[key]);
	};
};

// Update page and map with current restaurants
updateRestaurants = () => {
	const allCuisines = document.getElementById("cuisines-select");
	const allNeighborhoods = document.getElementById("neighborhoods-select");
	const cuisine = allCuisines[allCuisines.selectedIndex].value;
	const neighborhood = allNeighborhoods[allNeighborhoods.selectedIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(
		cuisine,
		neighborhood,
		(error, restaurants) => {
			if (error) {
				console.error(error);
			} else {
				resetRestaurants(restaurants);
				fillRestaurantsHTML();
			}
		}
	);
};

// AddEventListeners
document.addEventListener("DOMContentLoaded", (event) => {
	initMap(); // added
	fetchNeighborhoods();
	fetchCuisines();

	// Register service worker
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("./sw.js").catch(function (error) {
			console.error(error);
		});
	}
});
