var weatherMod = angular.module('WeatherApp', []);

weatherMod.controller('WeatherController', function($scope, $http){
	$scope.items = [
		{cityName: 'Phoenix, US', temp: '', hum: '', wind: '', cloud: '', rating: ''},
		{cityName: 'London, GB', temp: '', hum: '', wind: '', cloud: '', rating: ''},
		{cityName: 'Tokyo, JP', temp: '', hum: '', wind: '', cloud: '', rating: ''}
	];
	
	$scope.calcs = {avgTemp: '', hottest: '', avgHum: '', highHum: '', best: '', worst: ''};

	angular.element(document).ready(function () {
		for (var i = 0; i < $scope.items.length; i++) {
			$scope.update($scope.items[i]);
		}  
    });

	$scope.update = function(item) {	
		$http.get('http://api.openweathermap.org/data/2.5/weather?q=' + item.cityName)
		.success(function(data) {
		item.temp = (parseFloat(data.main.temp) - 273.15).toFixed(0);
		item.hum = data.main.humidity;
		item.wind = (data.wind.speed * 2.23694).toFixed(2);
		item.cloud = data.clouds.all;
	}).error(function(status) {
		//document.getElementById('test').innerHTML="some error";
	});		
	};

	var calculate = function() {
		$scope.calcs.avgTemp = calcAvg($scope.items, 'temp');
		$scope.calcs.avgHum = calcAvg($scope.items, 'hum');
		$scope.calcs.hottest = maxValue($scope.items, 'temp');
		$scope.calcs.highHum = maxValue($scope.items, 'hum');
		calcRating();
		$scope.calcs.best = maxValue($scope.items, 'rating');
		$scope.calcs.worst = minValue($scope.items, 'rating');
	};

	var calcAvg = function(data, property) {
		var avg = 0;
		var t;
		for(var i = 0; i < data.length; i++) {
			t = data[i];
			avg += parseFloat(t[property]);
		}
		return (avg / data.length).toFixed(0);
	};

	var maxValue = function(data, property) {
		var max = data[0];
		for(var i = 1; i < data.length; i++) {
			var t = data[i];
			var tmax = parseFloat(max[property]);
			var tt = parseFloat(t[property]);
			max = (tmax < tt) ? t : max;
		}
		return max.cityName;
	};

	var minValue = function(data, property) {
		var min = data[0];
		for(var i = 1; i < data.length; i++) {
			var t = data[i];
			var tmin = parseFloat(min[property]);
			var tt = parseFloat(t[property]);
			min = (tmin > tt) ? t : min;
		}
		return min.cityName;
	};

	var calcRating = function() {
		var data = $scope.items;
		for(var i = 0; i < data.length; i++) {
			data[i].rating = (parseFloat(data[i].temp)) * (1 - (parseFloat(data[i].hum) / 100)) -
			(parseFloat(data[i].wind) / 5) + (10 - (parseFloat(data[i].cloud)) / 100);
		}
	};

	$scope.$watch('items', calculate, true);
});
