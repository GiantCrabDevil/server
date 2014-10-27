var propIter = 1;
var kvIter = 1;
var uuidKey = "skynet-ser421";
var owner;
var pinLocations = new Array(0);
var CENTER;

function createOwner() {
	owner = document.getElementById('ownerNameInput').value;
	var payload = "uuid=" + owner + "&token=421";
	var response = post("http://skynet.im/devices", payload);
	var response2 = addLatLong(response, owner);
	// console.log(response2);
	if (response != undefined) {
		deviceOutput(response, "New Owner Device Created: ");
		addPinLocation(owner, response2);
		
		// enable all the buttons that assume an owner has been entered
		document.getElementById('addPropBtn').disabled=false;
		document.getElementById('createbtn').disabled=false;
		document.getElementById('submitDevice').disabled=false;
		document.getElementById('addKVBtn').disabled=false;
		document.getElementById('submitKVBtn').disabled=false;
		document.getElementById('deletebutton').disabled=false;
		document.getElementById('ownerbtn').disabled=true;
		document.getElementById('ownerNameInput').disabled=true;
	}
	
}
function addPinLocation(name, response) {
	var jObj = JSON.parse(response);
	pinLocations.push([name, parseFloat(jObj.lat), parseFloat(jObj.long)]);
	addOutput("AUTO ADDED GEO LOCATIONS:\nlat = " + jObj.lat +
				"\nlong = " + jObj.long);
	initialize();

}
function addProperty()
{
	var space = document.getElementById("properties");
	var innerHTMLAdd = "";
	innerHTMLAdd += "<div id=\"prop" + propIter + "\"><b> Key: </b>" +
				    "<input type=\"text\" id=\"key" + propIter + "\"/>" +
				    "<b> Value: </b>" +
				    "<input type=\"text\" id=\"value" + propIter + "\"/><br/></div>";
	space.innerHTML += innerHTMLAdd;
	propIter += 1;
}

function addKV()
{
	var space = document.getElementById("KVs");
	var innerHTMLAdd = "";
	innerHTMLAdd += "<div id=\"kv" + kvIter + "\">" +
					"<b> Key: </b>" +
					"<input type=\"text\" id=\"k" + kvIter + "\"/>" +
					"<b> Value: </b>" +
					"<input type=\"text\" id=\"v" + kvIter + "\"/> AND<br/>" +
					"</div>";
	space.innerHTML += innerHTMLAdd;
	kvIter += 1;

}

function addUuidToCookies()
{
	var uuid = document.getElementById("deviceNameInput").value;
	var cookies = document.cookie.split(';');
	var found = false;
	for(var i = 0; i < cookies.length; i++)
	{
		var theSplit = cookies[i].split('=');
		if(theSplit[0].trim() == uuidKey)
		{
			document.cookie=uuidKey + "=" + theSplit[1].trim() + ", " + uuid;
			found = true;
		}
	}
	if(!found)
	{
		document.cookie=uuidKey + "=" + uuid;
	}
	popPicklist();
}

function removeUUidFromCookies()
{
	var uuid = document.getElementById("deleteOwnerInput").value;
	if(uuid == '')
	{
		uuid = document.getElementById('uuidselect2').value;
	}
	var cookies = document.cookie.split(';');
	var splitOnComma;
	for(var i = 0; i < cookies.length; i++)
	{
		var theSplit = cookies[i].split('=');
		if(theSplit[0].trim() == uuidKey)
		{
			splitOnComma = theSplit[1].split(',');
			for(var j = 0; j < splitOnComma.length; j++)
			{
				if(splitOnComma[j].trim() == uuid.trim())
				{
					splitOnComma.splice(j, 1);
				}
			}
			//console.log(splitOnComma);
		}
	}
	var cookieString = uuidKey + "=";
	for(var i = 0; i < splitOnComma.length; i++)
	{
		cookieString += splitOnComma[i] + ", ";
	}
	document.cookie = cookieString;
	popPicklist();
}

function popPicklist()
{
	var element0 = document.getElementById("uuidselect0");
	var element1 = document.getElementById("uuidselect1");
	var element2 = document.getElementById("uuidselect2");
	var innerHTMLAdd = "";
	var cookies = document.cookie.split(';');
	for(var i = 0; i < cookies.length; i++)
	{
		var theSplit = cookies[i].split('=');
		if(theSplit[0].trim() == uuidKey)
		{
			var uuids = theSplit[1].split(',');
			for(var j = 0; j < theSplit[1].split(',').length; j++)
			{
				if(uuids[j] != '')
				innerHTMLAdd += "<option value=\"" + uuids[j].trim() + "\">" +
							 uuids[j].trim() + "</option>";
			}
		}
	}
	element0.innerHTML = innerHTMLAdd;
	element1.innerHTML = innerHTMLAdd;
	element2.innerHTML = innerHTMLAdd;
}

function getANDsProperties()
{
	var andString = "";
	for(var i = 0; i < propIter; i++)
	{
		var key = document.getElementById('key' + i).value;
		var value = document.getElementById('value' + i).value;
		andString += "&" + key + "=" + value;
	}
	// console.log(andString);
	return andString;
}

function getANDsKVs()
{
	var andString = "";
	for(var i = 0; i < kvIter; i++)
	{
		var key = document.getElementById('k' + i).value;
		var value = document.getElementById('v' + i).value;
		if (key != "" && value != ""){
			andString += "&" + key + "=" + value;
		}
	}
	// console.log(andString);
	return andString;
}

function addLatLong(response, uuid) {
	var jObj = JSON.parse(response);
	var ll = jObj.geo.ll;

	var payload = "lat=" + ll[0] + "&long=" + ll[1];
	var request = new XMLHttpRequest();
	request.open("PUT", "http://skynet.im/devices/" + uuid, false);
	request.setRequestHeader("Content-Type", 
	                           "application/x-www-form-urlencoded");
	request.setRequestHeader("skynet_auth_uuid", owner);
	request.setRequestHeader("skynet_auth_token", "421");
	request.send(payload);
	return request.responseText;
}
 
function post(uri, payload) {
	var request = new XMLHttpRequest();
	request.open("POST", uri, false);
	request.setRequestHeader("Content-Type", 
                           "application/x-www-form-urlencoded");
	request.send(payload);
	if(request.status == 200) {
		return request.responseText;
	} else {
		var temp = JSON.parse(request.responseText);
		var msg = temp.message != undefined ? temp.message : temp;
		output("Error creating device, skynet response: " + msg);
		return undefined;
	}
	
}

function createDevice() {
	var uuid = document.getElementById('deviceNameInput').value;
	if(uuid == '')
	{
		uuid = document.getElementById('uuidselect0').value;
	}
	var propertyString = getANDsProperties();
	var payload = "owner=" + owner + "&uuid=" + uuid;
	if (propertyString != undefined) {
		payload += propertyString;
	}
	// console.log(payload);
	var response = post("http://skynet.im/devices", payload);
	if (response != undefined) {
		var response2 = addLatLong(response, uuid);
		deviceOutput(response, "New Device Created: ");
		addPinLocation(uuid, response2);
		// console.log(response);
		addUuidToCookies();
	}
	
}

function deleteDevice() {
	var uuid = document.getElementById('deleteOwnerInput').value;
	if(uuid == '')
	{
		uuid = document.getElementById('uuidselect2').value;
	}
	// console.log(uuid);
	var request = new XMLHttpRequest();
	request.open("DELETE", "http://skynet.im/devices/" + uuid, false);
	request.setRequestHeader("skynet_auth_uuid", owner);
	request.setRequestHeader("skynet_auth_token", "421");
	request.send();
	if(request.status == 200) {
		output("Deivce " + uuid + " has been deleted");
		removeUUidFromCookies();
	} else {
		var temp = JSON.parse(request.responseText);
		var msg = temp.message != undefined ? temp.message : temp;
		output("Error deleting device, skynet response: " + msg);
	}
	
	console.log(request.responseText);
}

function getDevice() {
	var uuid = document.getElementById('deviceInput').value;
	if(uuid == '')
	{
		uuid = document.getElementById('uuidselect1').value;
	}
	var uri = "http://skynet.im/devices/" + uuid;
	get(uri);	
}

function get(uri) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = 
			function() {multiDeviceOutput(request); };
	request.open("GET", uri, true);
	request.setRequestHeader("skynet_auth_uuid", owner);
	request.setRequestHeader("skynet_auth_token", "421");
	request.send();
	//return request.responseText;
}

function searchDevice() {
	var searchString = getANDsKVs();
	var uri = "http://skynet.im/devices?owner=" + owner;
	if (searchString != undefined) {
		uri += searchString;
	}
	get(uri);
	//multiDeviceOutput(response);
	// console.log(response);
}

function deviceOutput(response, header) {
	var jObj = JSON.parse(response);
	var m = header + "\n";
	for (i in jObj) {
		m += i + " = " + jObj[i] + "\n";
	}
	output(m);
}

function multiDeviceOutput(request) {
	if (request.readyState == 4) {
        if (request.status == 200) {
	    	var jObj = JSON.parse(request.responseText);
			var m = "Search returned " + jObj.devices.length + " results\n";
			for (var i = 1; i <= jObj.devices.length; i++) {
				m += "Device " + i + ":\n";
				var dev = jObj.devices[i-1];
				for (j in dev) {
					m += "\t" + j + " = " + dev[j] + "\n";
				}
			}
			output(m);
		} else {
			var temp = JSON.parse(request.responseText);
			var msg = temp.message != undefined ? temp.message : temp;
			output("Error retrieving device, skynet response: " + msg);
		}
	}	
}

function output(msg) {
	var out = document.getElementById('idResponseArea');
	out.innerHTML = msg;
}
function addOutput(msg) {
	var out = document.getElementById('idResponseArea');
	out.innerHTML += msg;
}
// MAP STUFF 

function initialize() {
	  var mapOptions = {
	    zoom: 10,
	    center: new google.maps.LatLng(33.4294, -111.9431),
	    mapTypeId: google.maps.MapTypeId.ROADMAP
	  };
	 
	  var genericElectric;
	 
	  var map = new google.maps.Map(document.getElementById('map_canvas'),
	      mapOptions);

	
	
	for (var i = 0; i < pinLocations.length; i++) {  
	  	var marker = new google.maps.Marker({
	    position: new google.maps.LatLng(pinLocations[i][1], pinLocations[i][2]),
	    map: map
		});
	}


}
