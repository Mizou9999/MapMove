// url for fetchin Json data
let url = "https://kz.skif.me/coordinates.json";

// some global variables
let map;
let newArr = [];
let currentPosition;
// helpers functions
// transformation of time to calculate the speed
function transformDate(data) {
	let transformedDate = [];
	data.forEach(date => {
		let date2 = date[0].split("T");
		let year = date2[0].split("-");
		let time = date2[1].split(":");

		let finishDate = new Date(
			year[0],
			year[1] - 1,
			year[2],
			time[0],
			time[1],
			time[2]
		);
		transformedDate.push(finishDate);
	});
	return transformedDate;
}
// calculation of the full time based on the start/end
function calculateDate(data) {
	let transformedDate = transformDate(data);
	let start = transformedDate[0];
	let end = transformedDate[transformedDate.length - 1];
	let timeInSeconds = (new Date(end) - new Date(start)) / 1000;
	let timeInHours = timeInSeconds / 3600;
	//time in seconds
	return timeInHours;
}

// speed calculation
function calculateSpeed(distance, time) {
	return distance / time;
}

fetch(url)
	.then(data => data.json())
	.then(result => {
		// Add google map
		function initMap() {
			let data = result;
			const startLocation = data[0];
			const endLocation = data[data.length - 1];

			// Start location
			let myLocation = { lat: startLocation[2], lng: startLocation[1] };

			// map center
			map = new google.maps.Map(document.getElementById("map"), {
				zoom: 12,
				center: myLocation,
				mapTypeControl: true
			});

			// add icons
			let iconBase = "http://maps.google.com/mapfiles/kml/paddle";
			let startPoint = new google.maps.Marker({
				position: { lat: startLocation[2], lng: startLocation[1] },
				map: map,
				title: "Start",
				icon: iconBase + "/A.png"
			});
			let endPoint = new google.maps.Marker({
				position: { lat: endLocation[2], lng: endLocation[1] },
				map: map,
				title: "End",
				icon: iconBase + "/B.png"
			});
			let marker = new google.maps.Marker({
				position: { lat: startLocation[2], lng: startLocation[1] },
				map: map,
				title: "current position",
				icon: iconBase + "/blu-blank.png"
			});

			// adding the path
			const pathCoordinate = [];
			calculatePath(result, pathCoordinate);

			//Create the PolyLine based on the path
			const principePath = new google.maps.Polyline({
				path: pathCoordinate,
				geodesic: true,
				strokeColor: "#2A7884",
				strokeOpacity: 1.0,
				strokeWeight: 3
			});
			principePath.setMap(map);

			// distance in Meters
			const distanceInMeters = google.maps.geometry.spherical.computeLength(
				principePath.getPath()
			);
			//distance in KM
			const distanceInKm = distanceInMeters / 1000;

			// get the full time travled
			let timeInHours = calculateDate(result);
			let speedFullPath = calculateSpeed(distanceInKm, timeInHours);

			// create (play pause and containers to display infos)
			const container = document.querySelector(".btn-container");
			const playBtn = document.createElement("button");
			playBtn.innerHTML = "Play";
			playBtn.classList.add("btn");
			const pauseBtn = document.createElement("button");
			pauseBtn.innerHTML = "Pause";
			pauseBtn.classList.add("btn");
			container.appendChild(playBtn);
			container.appendChild(pauseBtn);

			//Animation of the MArker and paning the map to it
			let timer;
			playBtn.addEventListener("click", () => {
				//playing the animation from the first click
				let count = 0;
				if (newArr.length !== 0) {
					timer = setInterval(function() {
						if (count <= result.length - 1) {
							currentPosition = [
								newArr[count][2],
								newArr[count][1],
								newArr[count][0]
							];
							myLatlng = new google.maps.LatLng(
								currentPosition[0],
								currentPosition[1]
							);
							marker.setPosition(myLatlng);
							map.panTo(myLatlng);
							count += 1;
						}
					}, 30);
				} else {
					//playing the animation after the pause
					timer = setInterval(function() {
						if (count <= result.length - 1) {
							currentPosition = [
								result[count][2],
								result[count][1],
								result[count][0]
							];
							myLatlng = new google.maps.LatLng(
								currentPosition[0],
								currentPosition[1]
							);
							marker.setPosition(myLatlng);
							map.panTo(myLatlng);
							count += 1;
						}
					}, 30);
				}
			});

			pauseBtn.addEventListener("click", function() {
				//find index of current position and make a new array based on it :
				newArr = findItemInArray(result, currentPosition);
				newPath = [];
				calculatePath(newArr, newPath);
				//Create the PolyLine based on the path
				const secondPath = new google.maps.Polyline({
					path: newPath,
					geodesic: true,
					strokeOpacity: 0,
					strokeWeight: 0
				});
				secondPath.setMap(map);

				//distance in meters
				const newDistance = google.maps.geometry.spherical.computeLength(
					secondPath.getPath()
				);

				//distance in km
				const newDistanceInKm = newDistance / 1000;

				// get the new speed travled
				let newTimeInHours = calculateDate(newArr);
				let currentSpeed = calculateSpeed(newDistanceInKm, newTimeInHours);
				console.log("new Speed : ", currentSpeed);

				//display static info
				const infoContainer = document.querySelector(".updatedInfo");
				infoContainer.innerHTML = `время : ${currentPosition[2].split(
					"T"
				)} <br/>
		скорость: ${currentSpeed} км/ч`;
				clearInterval(timer);
			});
			const staticInfoContainer = document.querySelector(".staticInfo");
			staticInfoContainer.innerHTML = `полный путь : ${distanceInKm.toFixed(
				1
			)} км <br/> 
			средняя скорость : ${speedFullPath.toFixed(1)} км/ч <br/>
			время : ${timeInHours.toFixed(1)} часов`;
		}

		initMap();
	});
// another helpers functions
// calculate the current PAth
function calculatePath(data, pathArray) {
	data.forEach(element => {
		pathArray.push({
			lat: element[2],
			lng: element[1]
		});
	});
}
// find the index of the current position
function findItemInArray(data, element) {
	for (let i = 0; i < data.length; i++) {
		if (
			data[i][0] == element[2] &&
			data[i][1] == element[1] &&
			data[i][2] == element[0]
		) {
			newArr = data.slice(i, data.length);
			return newArr;
		}
	}
}
