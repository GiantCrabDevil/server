var ACCESS_TOKEN = '374257607-5XND7fIXqVEXJno9pnrApFMMtlVMrCwD8d5YjBvp';
var ACCESS_TOKEN_SECRET = 'GlVfeABnQjzlv2hJzYxRTrrnhlARoOZfs21bJ6xKUntUM';
var CONSUMER_KEY = 'dqkUcxN2mr2A0N5GBVUvg8jui';
var CONSUMER_KEY_SECRET = 'VL3aPZQyjMZTh5zqxiGF9k32H3GBoyEhpxeiuL30OIpPVplb6m';
var bearerToken;

function feedMe() {
	var search = document.getElementById('searchField').value;
	var uri = 'https://api.twitter.com/1.1/';
	uri += 'user_timeline.json?scree_name=GiantCrabDevil&count=5';
	// uri += 'search/tweets.json?q=GiantCrabDevil&src=typd';
	get(uri);
}

function getBearerToken() {
	var url = 'https://api.twitter.com/oauth2/token';
	var credentials = 'basic ';
	credentials += window.btoa(CONSUMER_KEY + ':' + CONSUMER_KEY_SECRET);
	credentials += 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8';
	var payload = 'grant_type=client_credentials';
	var request = new XMLHttpRequest();
	
	request.open('POST', url, true);
	request.withCredentials = true;
	request.setRequestHeader('Access-Control-Allow-Origin', '*');
	request.setRequestHeader('Authorization', credentials);
	//request.setRequestHeader('Host', 'api.twitter.com');
	//request.setRequestHeader('User-Agent', 'DamonTwitterTest');
	//request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
	//request.setRequestHeader('Content-Length', 29);
	//request.setRequestHeader('Accept-Encoding', 'gzip');
	request.onreadystatechange = 
			function() {outputSearch(request.responseText); };
	request.send(payload);
}

function get(uri) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = 
			function() {outputSearch(request.responseText); };
	request.open("GET", uri, true);
	//request.setRequestHeader("accesstoken", ACCESS_TOKEN);
	//request.setRequestHeader("accesstokensecret", ACCESS_TOKEN_SECRET);
	request.send();
}

function outputSearch(request) {
	if (request.readyState == 4) {
        if (request.status == 200) {
	    	//var jObj = JSON.parse(request.responseText);
			//var m = "Search returned " + jObj.devices.length + " results\n";
			/*for (var i = 1; i <= jObj.devices.length; i++) {
				m += "Device " + i + ":\n";
				var dev = jObj.devices[i-1];
				for (j in dev) {
					m += "\t" + j + " = " + dev[j] + "\n";
				}
			}*/
			output(request.responseText);
		} else {
			// var temp = JSON.parse(request.responseText);
			// var msg = temp.message != undefined ? temp.message : temp;
			// output("Error retrieving device, skynet response: " + msg);
			output(request.responseText);
		}
	} else {
		console.log('polling...');
	}
}

function output(msg) {
	var field = document.getElementById('twat');
	field.innerHTML = msg;
}