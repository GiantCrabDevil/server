function webGLStart() {
	var CANVAS=document.getElementById('datCanvas');
	//CANVAS.width = window.innerWidth;
	//CANVAS.height = window.innerHeight;
	console.log(CANVAS.width, CANVAS.height);

	var GL;
	try {
		GL = CANVAS.getContext("experimental-webgl", {antialias: false});
	} catch (e) {
		alert("Browser not webgl compatible, go kill yourself");
		return false;
	}
}

