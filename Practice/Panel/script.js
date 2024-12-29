// Масив з координатами магазинів та їх адресами
const stores = [
	{ coords: [49.565238993184195, 34.503837911409185], address: "Вулиця Івана Мазепи, 45" },
	{ coords: [49.560583519910985, 34.526555638633965], address: "Вулиця Європейська, 185" },
	{ coords: [49.578480304302715, 34.5405689840106], address: "Вулиця Європейська, 60А" },
	{ coords: [49.60012675999788, 34.53322319368779], address: "Вулиця Павленківська площа, 3" },
	{ coords: [49.57125337824502, 34.5853778949341], address: "Проспект Миру, 30А" }
];

// Ініціалізація карти
const map = L.map("map");
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Функція для обчислення відстані між двома координатами (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
	const R = 6371; // Радіус Землі в кілометрах
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Відстань в кілометрах
}

// Додавання маркерів магазинів на карту
stores.forEach((store, index) => {
	const marker = L.marker(store.coords).addTo(map);
	marker.bindPopup(store.address);

	// Додати магазин у список бічної панелі
	const storeList = document.getElementById("store-list");
	const listItem = document.createElement("li");
	listItem.textContent = store.address;

	// При натисканні на магазин у списку переміщатися до маркера
	listItem.addEventListener("click", () => {
		// Перевіряємо відстань між магазинами, щоб визначити зум
		let zoomLevel = 13; // Початковий рівень зуму

		stores.forEach(store2 => {
			const distance = getDistance(store.coords[0], store.coords[1], store2.coords[0], store2.coords[1]);
			if (distance < 0.5) {  // Якщо магазини дуже близько, збільшуємо зум
				zoomLevel = 15;
			}
		});

		// Переміщаємо карту до вибраного магазину з відповідним зумом
		map.setView(store.coords, zoomLevel);
		marker.openPopup();
	});

	storeList.appendChild(listItem);
});

// Знаходження поточного місцезнаходження
navigator.geolocation.getCurrentPosition(function (position) {
	const userLat = position.coords.latitude;
	const userLon = position.coords.longitude;

	// Додавання маркера на поточне місцезнаходження
	const userMarker = L.marker([userLat, userLon], { icon: L.icon({ iconUrl: 'red.png', iconSize: [25, 41] }) }).addTo(map);
	userMarker.bindPopup("Моє місцезнаходження").openPopup();


	// Знайти найближчий магазин
	let nearestStore = null;
	let minDistance = Infinity;

	stores.forEach(store => {
		const distance = getDistance(userLat, userLon, store.coords[0], store.coords[1]);
		if (distance < minDistance) {
			minDistance = distance;
			nearestStore = store;
		}
	});

	// Виділити найближчий магазин
	if (nearestStore) {
		const nearestMarker = L.marker(nearestStore.coords, {
			icon: L.icon({
				iconUrl: 'green.webp',
				iconSize: [25, 41]
			})
		}).addTo(map);
		nearestMarker.bindPopup(
			`Найближчий магазин: ${nearestStore.address} (${minDistance.toFixed(2)} км)`
		).openPopup();

		// Центруємо карту на найближчий магазин з відповідним зумом
		let zoomLevel = 13;
		stores.forEach(store2 => {
			const distance = getDistance(nearestStore.coords[0], nearestStore.coords[1], store2.coords[0], store2.coords[1]);
			if (distance < 0.5) {  // Якщо магазини дуже близько, збільшуємо зум
				zoomLevel = 15;
			}
		});
		map.setView(nearestStore.coords, zoomLevel);  // Центруємо на найближчий магазин
	}

}, function (error) {
	console.error("Не вдалося отримати геолокацію:", error.message);
});
const options = {
	enableHighAccuracy: true, // використання високої точності
	timeout: 5000,            // максимальний час на визначення
	maximumAge: 0             // не використовувати кешовані дані
};

navigator.geolocation.getCurrentPosition(function (position) {
	const userLat = position.coords.latitude;
	const userLon = position.coords.longitude;

	console.log(`Точне місцезнаходження: ${userLat}, ${userLon}`);
}, function (error) {
	console.error("Не вдалося отримати геолокацію:", error.message);
}, options);
