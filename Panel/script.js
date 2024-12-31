// Клас для роботи з картою
class StoreMap {
	constructor(mapId) {
		this.map = L.map(mapId);
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);
	}

	setView(coords, zoom) {
		this.map.setView(coords, zoom);
	}

	addMarker(coords, options = {}) {
		const marker = L.marker(coords, options).addTo(this.map);
		return marker;
	}

	calculateDistance(lat1, lon1, lat2, lon2) {
		const R = 6371; // Радіус Землі в кілометрах
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c; // Відстань у кілометрах
	}
}

// Клас для магазину
class Store {
	constructor(coords, address) {
		this.coords = coords;
		this.address = address;
	}

	createMarker(map) {
		const marker = map.addMarker(this.coords);
		marker.bindPopup(this.address);
		return marker;
	}
}

// Клас для управління списком магазинів
class StoreManager {
	constructor(stores, map, storeListId) {
		this.stores = stores;
		this.map = map;
		this.storeList = document.getElementById(storeListId);
	}

	addStoresToMap() {
		this.stores.forEach((store) => {
			const marker = store.createMarker(this.map);

			// Додати магазин у список бічної панелі
			const listItem = document.createElement("li");
			listItem.textContent = store.address;
			listItem.addEventListener("click", () => {
				let zoomLevel = 13;
				this.stores.forEach(store2 => {
					const distance = this.map.calculateDistance(
						store.coords[0], store.coords[1],
						store2.coords[0], store2.coords[1]
					);
					if (distance < 0.5) {
						zoomLevel = 15;
					}
				});
				this.map.setView(store.coords, zoomLevel);
				marker.openPopup();
			});
			this.storeList.appendChild(listItem);
		});
	}

	findNearestStore(userLat, userLon) {
		let nearestStore = null;
		let minDistance = Infinity;

		this.stores.forEach(store => {
			const distance = this.map.calculateDistance(userLat, userLon, store.coords[0], store.coords[1]);
			if (distance < minDistance) {
				minDistance = distance;
				nearestStore = store;
			}
		});

		return { nearestStore, minDistance };
	}
}

// Клас для управління геолокацією
class UserLocation {
	constructor(map, storeManager) {
		this.map = map;
		this.storeManager = storeManager;
	}

	locateUser() {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const userLat = position.coords.latitude;
				const userLon = position.coords.longitude;

				const userMarker = this.map.addMarker([userLat, userLon], {
					icon: L.icon({ iconUrl: 'red.png', iconSize: [25, 41] })
				});
				userMarker.bindPopup("Моє місцезнаходження").openPopup();

				const { nearestStore, minDistance } = this.storeManager.findNearestStore(userLat, userLon);
				if (nearestStore) {
					const nearestMarker = this.map.addMarker(nearestStore.coords, {
						icon: L.icon({ iconUrl: 'green.webp', iconSize: [25, 41] })
					});
					nearestMarker.bindPopup(
						`Найближчий магазин: ${nearestStore.address} (${minDistance.toFixed(2)} км)`
					).openPopup();

					let zoomLevel = 13;
					this.storeManager.stores.forEach(store2 => {
						const distance = this.map.calculateDistance(
							nearestStore.coords[0], nearestStore.coords[1],
							store2.coords[0], store2.coords[1]
						);
						if (distance < 0.5) {
							zoomLevel = 15;
						}
					});
					this.map.setView(nearestStore.coords, zoomLevel);
				}
			},
			(error) => {
				console.error("Не вдалося отримати геолокацію:", error.message);
			},
			{
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 0
			}
		);
	}
}

// Ініціалізація
const storesData = [
	{ coords: [49.565238993184195, 34.503837911409185], address: "Вулиця Івана Мазепи, 45" },
	{ coords: [49.560583519910985, 34.526555638633965], address: "Вулиця Європейська, 185" },
	{ coords: [49.578480304302715, 34.5405689840106], address: "Вулиця Європейська, 60А" },
	{ coords: [49.60012675999788, 34.53322319368779], address: "Вулиця Павленківська площа, 3" },
	{ coords: [49.57125337824502, 34.5853778949341], address: "Вулиця Проспект Миру, 30А" }
];

const storeInstances = storesData.map(data => new Store(data.coords, data.address));
const map = new StoreMap("map");
const storeManager = new StoreManager(storeInstances, map, "store-list");
const userLocation = new UserLocation(map, storeManager);

storeManager.addStoresToMap();
userLocation.locateUser();
