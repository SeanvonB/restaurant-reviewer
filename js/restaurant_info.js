// restaurant_info.js

// This file constructs the map and info elements for specific restaurants,
// while main.js does the same for the home page.

// Globals
const favicon = document.querySelector("#favicon");
let newMap;
let restaurant;

// Randomize favicon
favicon.href = `./img/favicon-${Math.floor(Math.random() * 9) + 1}.ico`;

// Initialize Leaflet map
initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) {
			console.error(error);
		} else {
			self.newMap = L.map("map", {
				attributionControl: false,
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				doubleClickZoom: false,
				dragging: !L.Browser.mobile,
				scrollWheelZoom: false,
				zoom: 15,
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

			self.newMap.on("click", onClickMap);

			fillBreadcrumb();

			const marker = DBHelper.mapMarkerForRestaurant(
				self.restaurant,
				self.newMap
			);
			marker.bindPopup(
				`<a href="${marker.options.url}">${
					marker.options.title
				}</a></br>
				<img src="${DBHelper.urlForRestaurantImage(restaurant)}"></img>`
			);
			marker.on("click", onClickMarker);

			function onClickMap(e) {
				self.newMap.panTo(e.latlng);
			}
			function onClickMarker() {
				marker.openPopup();
			}
		}
	});
};

// Initialize Google map
// window.initMap = () => {
//   fetchRestaurantFromURL((error, restaurant) => {
//     if (error) { // Got an error!
//       console.error(error);
//     } else {
//       self.map = new google.maps.Map(document.getElementById('map'), {
//         zoom: 16,
//         center: restaurant.latlng,
//         scrollwheel: false
//       });
//       fillBreadcrumb();
//       DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
//     }
//   });
// }

// Create individual review items
createReviewHTML = (review) => {
	const li = document.createElement("li");
	const name = document.createElement("p");
	name.classList.add("review", "reviewer");
	name.textContent = review.name;
	li.appendChild(name);

	const date = document.createElement("p");
	date.classList.add("review", "date");
	date.textContent = review.date;
	li.appendChild(date);

	const rating = document.createElement("p");
	const stars = document.createElement("span");
	rating.classList.add("review", "rating");
	stars.classList.add("review", "stars");
	rating.textContent = "Rating: ";
	stars.textContent = createReviewStars(review.rating);
	rating.appendChild(stars);
	li.appendChild(rating);

	const comments = document.createElement("blockquote");
	comments.classList.add("review", "comments");
	comments.textContent = review.comments;
	li.appendChild(comments);

	return li;
};

// Convert rating to unicode stars
createReviewStars = (rating) => {
	let total = "";
	for (let i = 0; i < rating; i++) {
		total += "★";
	}
	while (total.length < 5) {
		total += "☆";
	}
	return total;
};

// Get current restaurant from page URL
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) {
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName("id");
	if (!id) {
		error = "No restaurant ID in URL";
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/// Add restaurant name to breadcrumb navigation
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById("breadcrumb");
	const li = document.createElement("li");
	li.textContent = restaurant.name;
	breadcrumb.appendChild(li);
};

// Add restaurant info to page
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const address = document.getElementById("restaurant-address");
	const cuisine = document.getElementById("restaurant-cuisine");
	const image = document.getElementById("restaurant-img");
	const name = document.getElementById("restaurant-name");

	address.textContent = restaurant.address;
	cuisine.textContent = restaurant.cuisine_type;
	image.alt = `${restaurant.name}, ${restaurant.neighborhood}`;
	image.className = "restaurant-img";
	image.src = DBHelper.urlForRestaurantImage(restaurant);
	name.textContent = restaurant.name;

	// Fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// Fill reviews
	fillReviewsHTML();
};

// Add table of operating hours to restaurant info
fillRestaurantHoursHTML = (
	operatingHours = self.restaurant.operating_hours
) => {
	const hours = document.getElementById("restaurant-hours");
	for (let key in operatingHours) {
		const row = document.createElement("tr");

		const day = document.createElement("td");
		day.textContent = key;
		row.appendChild(day);

		const time = document.createElement("td");
		time.textContent = operatingHours[key];
		if (time.textContent === "CLOSED") {
			time.classList.add("closed");
		}
		row.appendChild(time);

		hours.appendChild(row);
	}
};

// Add all reviews to restaurant info
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById("reviews-container");
	const list = document.getElementById("reviews-list");

	if (!reviews) {
		const noReviews = document.createElement("li");
		noReviews.classList.add("no-reviews");
		noReviews.textContent = "This location hasn't been reviewed yet.";
		list.appendChild(noReviews);
	} else {
		reviews.forEach((review) => {
			list.appendChild(createReviewHTML(review));
		});
	}
	container.appendChild(list);
};

// Get parameter by name from page URL
getParameterByName = (name, url) => {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return "";
	return decodeURIComponent(results[2].replace(/\+/g, " "));
};

// AddEventListeners
document.addEventListener("DOMContentLoaded", (event) => {
	initMap();

	// Register service worker
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("./sw.js").catch(function (error) {
			console.error(error);
		});
	}
});
