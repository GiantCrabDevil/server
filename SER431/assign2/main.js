window.requestAnimationFrame = (function () {
   return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function (callback) {
             window.setTimeout(callback, 1000 / 60);
         };
     })();

var canvas;
var device;
var meshes = [];
var mera;
var mode = 0;
var storedMode = 0;
var divCurrentFPS;
var divAverageFPS;
var previousDate = Date.now();
var lastFPSValues = new Array(60);
var showNormals = false;
var state = 0;
var vertStorage;
var faceStorage;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.getElementById("frontBuffer");
    mera = new SoftEngine.Camera();
    device = new SoftEngine.Device(canvas);
    divCurrentFPS = document.getElementById("FPS");
    divAverageFPS = document.getElementById("AvgFPS");
    debugField = document.getElementById("Debug");
    mera.Position = new BABYLON.Vector3(0, 0, 10);
    mera.Target = new BABYLON.Vector3(0, 0, 0);
    document.onkeydown = getChar;
    device.LoadJSONFileAsync("sphere.babylon", loadJSONCompleted);
    vertStorage = new Array(5);
    faceStorage = new Array(5);
}

function loadJSONCompleted(meshesLoaded) {
    meshes = meshesLoaded;
    // Calling the HTML5 rendering loop
    requestAnimationFrame(drawingLoop);
}

// Rendering loop handler
function drawingLoop() {
    var now = Date.now();
    var currentFPS = 1000 / (now - previousDate);
    previousDate = now;

    divCurrentFPS.textContent = currentFPS.toFixed(2);
    if (lastFPSValues.length < 60) {
        lastFPSValues.push(currentFPS);
    } else {
        lastFPSValues.shift();
        lastFPSValues.push(currentFPS);
        var totalValues = 0;
        for (var i = 0; i < lastFPSValues.length; i++) {
            totalValues += lastFPSValues[i];
        }

        var averageFPS = totalValues / lastFPSValues.length;
        divAverageFPS.textContent = averageFPS.toFixed(2);
    }

    device.clear();

    for (var i = 0; i < meshes.length; i++) {
        // rotating slightly the mesh during each frame rendered

        //meshes[i].Rotation.x += 0.01;
        meshes[i].Rotation.y += 0.01;
    }

    // Doing the various matrix operations
    device.render(mera, meshes, mode, showNormals);
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling the HTML5 rendering loop recursively
    requestAnimationFrame(drawingLoop);
}

function getChar(event) {
    event = event || window.event;
    
    // W (toggle wire frame)
    if (event.keyCode == 87) {   
        if (mode != 0) {
            storedMode = mode;
            mode = 0;
        } else {
            mode = storedMode;
        }
    // F (flat shading)
    } else if (event.keyCode == 70) {
        mode = 1;
    // G (gauroud shading)
    } else if (event.keyCode == 71) {
        
        mode = 2;
    // P (phong shading)
    } else if (event.keyCode == 80) {
        mode = 3;
    // N (toggle normals)
    } else if (event.keyCode == 78) {
        showNormals = showNormals ? false : true;
    } else if (event.keyCode == 107) {
        if (state < 5) {
            state++;
            device.loopSubDev(meshes[0], state);
            debug(state);
        } else {
            debug("division max");
        }
    } else if (event.keyCode == 109) {
        if (state > 0) {
            state--;
            device.loopSubDev(meshes[0], state);
            debug(state);
        } else {
            debug("back to original");
        }
    } else if (event.keyCode == 49) {
        // 1
    }
    //debug(event.keyCode);
}

function debug(msg){
    debugField.textContent=msg
}
