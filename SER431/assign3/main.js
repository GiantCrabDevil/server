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
    mera.Position = new BABYLON.Vector3(0, 10, 0.1);
    mera.Target = new BABYLON.Vector3(0, 0, 0);
    document.onkeydown = getChar;
    //device.LoadJSONFileAsync("sphere.babylon", loadJSONCompleted);
    var mesh = new SoftEngine.Mesh("Cube", 8);
    meshes.push(mesh);
    mesh.Vertices[0] = {Coordinates:new BABYLON.Vector3(-1, 1, 1), Normal:new BABYLON.Vector3(-0.3333333,0.3333333,0.3333333), WorldCoordinates:null};
    mesh.Vertices[1] = {Coordinates:new BABYLON.Vector3(1, 1, 1), Normal:new BABYLON.Vector3(0.3333333,0.3333333,0.3333333), WorldCoordinates:null};
    mesh.Vertices[2] = {Coordinates:new BABYLON.Vector3(-1, -1, 1), Normal:new BABYLON.Vector3(-0.3333333,-0.3333333,0.3333333), WorldCoordinates:null};
    mesh.Vertices[3] = {Coordinates:new BABYLON.Vector3(-1, -1, -1), Normal:new BABYLON.Vector3(-0.3333333,-0.3333333,-0.3333333), WorldCoordinates:null};
    mesh.Vertices[4] = {Coordinates:new BABYLON.Vector3(-1, 1, -1), Normal:new BABYLON.Vector3(-0.3333333,0.3333333,-0.3333333), WorldCoordinates:null};
    mesh.Vertices[5] = {Coordinates:new BABYLON.Vector3(1, 1, -1), Normal:new BABYLON.Vector3(0.3333333,0.3333333,-0.3333333), WorldCoordinates:null};
    mesh.Vertices[6] = {Coordinates:new BABYLON.Vector3(1, -1, 1), Normal:new BABYLON.Vector3(0.3333333,-0.3333333,0.3333333), WorldCoordinates:null};
    mesh.Vertices[7] = {Coordinates:new BABYLON.Vector3(1, -1, -1), Normal:new BABYLON.Vector3(0.3333333,-0.3333333,-0.3333333), WorldCoordinates:null};
    mesh.Faces[0] = {
        A: 6,
        B: 1,
        C: 7,
        D: 5
    };
    mesh.Faces[1] = {
        A: 4,
        B: 3,
        C: 5,
        D: 7
    };
   mesh.Faces[2] = {
        A: 2,
        B: 3,
        C: 0,
        D: 4
    };
    mesh.Faces[3] = {
        A: 6,
        B: 2,
        C: 1,
        D: 0
    };
    mesh.Faces[4] = {
        A: 0,
        B: 4,
        C: 1,
        D: 5
    };
    mesh.Faces[5] = {
        A: 3,
        B: 2,
        C: 7,
        D: 6
    };
    for(var i = 0; i < mesh.Faces.length; i++) {
        mesh.halfEdges[i*4+0] = {
            vert: mesh.Faces[i].A,
            prev: i*4+3,
            next: i*4+1,
            pair: null,
            left: i
        };
        mesh.halfEdges[i*4+1] = {
            vert: mesh.Faces[i].C,
            prev: i*4+0,
            next: i*4+2,
            pair: null,
            left: i
        };
        mesh.halfEdges[i*4+2] = {
            vert: mesh.Faces[i].D,
            prev: i*4+1,
            next: i*4+3,
            pair: null,
            left: i
        };
        mesh.halfEdges[i*4+3] = {
            vert: mesh.Faces[i].B,
            prev: i*4+2,
            next: i*4+0,
            pair: null,
            left: i
        };
    }
    
    for(var i = 0; i < mesh.halfEdges.length; i++) 
    {
        for(var j = 0; j < mesh.halfEdges.length; j++) 
        {
            if (mesh.halfEdges[i].vert === mesh.halfEdges[mesh.halfEdges[j].next].vert &&
                mesh.halfEdges[mesh.halfEdges[i].next].vert === mesh.halfEdges[j].vert) 
            {
                mesh.halfEdges[i].pair = j;
            }
        }
    }
    //console.log(mesh.halfEdges);
    //debug(mesh.halfEdges);
    vertStorage = new Array(5);
    faceStorage = new Array(5);
    requestAnimationFrame(drawingLoop);
}
1
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

        meshes[i].Rotation.z -= 0.01;
        //meshes[i].Rotation.y += 0.01;
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
            device.catclarkSubDev(meshes[0], state);
            debug(state);
        } else {
            debug("division max");
        }
    } else if (event.keyCode == 109) {
        if (state > 0) {
            state--;
            device.catclarkSubDev(meshes[0], state);
            debug(state);
        } else {
            debug("back to original");
        }
    } else if (event.keyCode == 49) {
        // 1
    }
    //debug(event.keyCode);
}

function debug1(msg){
    debugField.textContent=msg
}

function debug(param)
{
    for(var i in param)
    {
        console.log(i, param[i]);
    }
}
