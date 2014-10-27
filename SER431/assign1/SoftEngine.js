var SoftEngine;
(function (SoftEngine) {
    var Camera = (function () {
        function Camera() {
            this.Position = BABYLON.Vector3.Zero();
            this.Target = BABYLON.Vector3.Zero();
        }
        return Camera;
    })();
    SoftEngine.Camera = Camera;    
    var Mesh = (function () {
        function Mesh(name, verticesCount, facesCount) {
            this.name = name;
            this.Vertices = new Array(verticesCount);
            this.Faces = new Array(facesCount);
            this.Rotation = new BABYLON.Vector3(0, 0, 0);
            this.Position = new BABYLON.Vector3(0, 0, 0);
        }
        return Mesh;
    })();
    SoftEngine.Mesh = Mesh;    
    var Device = (function () {
        function Device(canvas) {
            this.workingCanvas = canvas;
            this.workingWidth = canvas.width;
            this.workingHeight = canvas.height;
            this.workingContext = this.workingCanvas.getContext("2d");
            this.depthbuffer = new Array(this.workingWidth * this.workingHeight);
            this.mode = 0;
            //this.showNormals = false;
            this.lightPos = new BABYLON.Vector3(0, 10, 10);
        }
        Device.prototype.clear = function () {
            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
            for (var i = 0; i < this.depthbuffer.length; i++) {
                this.depthbuffer[i] = 10000000;
            }
        };
        Device.prototype.present = function () {
            this.workingContext.putImageData(this.backbuffer, 0, 0);
        };
        Device.prototype.putPixel = function (x, y, z, color) {
            this.backbufferdata = this.backbuffer.data;
            var index = ((x >> 0) + (y >> 0) * this.workingWidth);
            var index4 = index * 4;
            if(this.depthbuffer[index] < z) {
                return;
            }
            this.depthbuffer[index] = z;
            this.backbufferdata[index4] = color.r * 255;
            this.backbufferdata[index4 + 1] = color.g * 255;
            this.backbufferdata[index4 + 2] = color.b * 255;
            this.backbufferdata[index4 + 3] = color.a * 255;      
        };
        Device.prototype.project = function (vertex, transMat, world) {
            // transforming the coordinates into 2D space
            var point2d = BABYLON.Vector3.TransformCoordinates(vertex.Coordinates, transMat);
            // transforming the coordinates & the normal to the vertex in the 3D world
            var point3DWorld = BABYLON.Vector3.TransformCoordinates(vertex.Coordinates, world);
            var normal3DWorld = BABYLON.Vector3.TransformCoordinates(vertex.Normal, world);

            // The transformed coordinates will be based on coordinate system
            // starting on the center of the screen. But drawing on screen normally starts
            // from top left. We then need to transform them again to have x:0, y:0 on top left.
            var x = point2d.x * this.workingWidth + this.workingWidth / 2.0;
            var y = -point2d.y * this.workingHeight + this.workingHeight / 2.0;

            return ({
                Coordinates: new BABYLON.Vector3(x, y, point2d.z),
                Normal: normal3DWorld,
                WorldCoordinates: point3DWorld
            });
        };
        Device.prototype.drawPoint = function (point, color) {
            if (color == undefined) {
                var color = new BABYLON.Color4(1, 1, 0, 1);
            }
            if(point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
                this.putPixel(point.x, point.y, point.z, color);
            }
        };
        Device.prototype.drawLine = function (point0, point1) {
            var dist = point1.subtract(point0).length();
            if(dist < 2) {
                return;
            }
            var middlePoint = point0.add((point1.subtract(point0)).scale(0.5));
            this.drawPoint(middlePoint);
            this.drawLine(point0, middlePoint);
            this.drawLine(middlePoint, point1);
        };
        Device.prototype.drawBline = function (point0, point1) {
            var x0 = point0.Coordinates.x >> 0;
            var y0 = point0.Coordinates.y >> 0;
            var x1 = point1.Coordinates.x >> 0;
            var y1 = point1.Coordinates.y >> 0;
            var dx = Math.abs(x1 - x0);
            var dy = Math.abs(y1 - y0);
            var sx = (x0 < x1) ? 1 : -1;
            var sy = (y0 < y1) ? 1 : -1;
            var err = dx - dy;
            while(true) {
                this.drawPoint(new BABYLON.Vector2(x0, y0));
                if((x0 == x1) && (y0 == y1)) {
                    break;
                }
                var e2 = 2 * err;
                if(e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }
                if(e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
        };
        // Clamping values to keep them between 0 and 1
        Device.prototype.clamp = function (value, min, max) {
            if (typeof min === "undefined") { min = 0; }
            if (typeof max === "undefined") { max = 1; }
            return Math.max(min, Math.min(value, max));
        };
        // Interpolating the value between 2 vertices 
        // min is the starting point, max the ending point
        // and gradient the % between the 2 points
        Device.prototype.interpolate = function (min, max, gradient) {
            return min + (max - min) * this.clamp(gradient);
        };

        // drawing line between 2 points from left to right
        // papb -> pcpd
        // pa, pb, pc, pd must then be sorted before
        Device.prototype.processScanLine = function (data, va, vb, vc, vd, color) {
            var pa = va.Coordinates;
            var pb = vb.Coordinates;
            var pc = vc.Coordinates;
            var pd = vd.Coordinates;

            // Thanks to current Y, we can compute the gradient to compute others values like
            // the starting X (sx) and ending X (ex) to draw between
            // if pa.Y == pb.Y or pc.Y == pd.Y, gradient is forced to 1
            var gradient1 = pa.y != pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
            var gradient2 = pc.y != pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

            var sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
            var ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

            // starting Z & ending Z
            var z1 = this.interpolate(pa.z, pb.z, gradient1);
            var z2 = this.interpolate(pc.z, pd.z, gradient2);

            if (this.mode == 2) {
                var snl = this.interpolate(data.ndotla, data.ndotlb, gradient1);
                var enl = this.interpolate(data.ndotlc, data.ndotld, gradient2);
            }
            if (this.mode == 3) {
                var normal1 = new BABYLON.Vector3(
                                            this.interpolate(va.Normal.x, vb.Normal.x, gradient1),
                                            this.interpolate(va.Normal.y, vb.Normal.y, gradient1),
                                            this.interpolate(va.Normal.z, vb.Normal.z, gradient1));
                var normal2 = new BABYLON.Vector3(
                                            this.interpolate(vc.Normal.x, vd.Normal.x, gradient2),
                                            this.interpolate(vc.Normal.y, vd.Normal.y, gradient2),
                                            this.interpolate(vc.Normal.z, vd.Normal.z, gradient2));
            }
            // drawing a line from left (sx) to right (
            for (var x = sx; x < ex; x++) {
                var gradient = (x - sx) / (ex - sx);

                var z = this.interpolate(z1, z2, gradient);
                var ndotl;
                if (this.mode == 1) {
                    ndotl = data.ndotla;
                } else if (this.mode == 2) {
                    ndotl = this.interpolate(snl, enl, gradient); 
                } else if (this.mode == 3) {
                    
                    var normalFinal = new BABYLON.Vector3(
                                            this.interpolate(normal1.x, normal2.x, gradient),
                                            this.interpolate(normal1.y, normal2.y, gradient),
                                            this.interpolate(normal1.z, normal2.z, gradient));
                    ndotl = this.computeNDotL(va.WorldCoordinates, 
                                            normalFinal, this.lightPos);
                }
                
                // changing the color value using the cosine of the angle
                // between the light vector and the normal vector
                this.drawPoint(new BABYLON.Vector3(x, data.currentY, z), 
                               new BABYLON.Color4(color.r * ndotl, color.g * ndotl, color.b * ndotl, 1));
            }
        };
        Device.prototype.computeNDotL = function (vertex, normal, lightPosition) {
            var lightDirection = lightPosition.subtract(vertex);

            normal.normalize();
            lightDirection.normalize();

            return Math.max(0, BABYLON.Vector3.Dot(normal, lightDirection));
        };
        Device.prototype.drawTriangle = function (v1, v2, v3, color) {
            // Sorting the points in order to always have this order on screen p1, p2 & p3
            // with p1 always up (thus having the Y the lowest possible to be near the top screen)
            // then p2 between p1 & p3
            if (v1.Coordinates.y > v2.Coordinates.y) {
                var temp = v2;
                v2 = v1;
                v1 = temp;
            }

            if (v2.Coordinates.y > v3.Coordinates.y) {
                var temp = v2;
                v2 = v3;
                v3 = temp;
            }

            if (v1.Coordinates.y > v2.Coordinates.y) {
                var temp = v2;
                v2 = v1;
                v1 = temp;
            }

            var p1 = v1.Coordinates;
            var p2 = v2.Coordinates;
            var p3 = v3.Coordinates;
            
            var data = {};
            var nl1, nl2, nl3;

            if (this.mode == 1) {
                var vnFace = (v1.Normal.add(v2.Normal.add(v3.Normal))).scale(1 / 3);
                var centerPoint = (v1.WorldCoordinates.add(v2.WorldCoordinates.add(v3.WorldCoordinates))).scale(1 / 3);
                // computing the cos of the angle between the light vector and the normal vector
                // it will return a value between 0 and 1 that will be used as the intensity of the color
                var ndotl = this.computeNDotL(centerPoint, vnFace, this.lightPos);
                var data = { ndotla: ndotl };

                if (showNormals) {
                    //console.log(new BABYLON.Vector2(centerPoint.x + vnFace.x,
                    //                           centerPoint.y + vnFace.y));
                }
            } else if (this.mode == 2) {
                var nl1 = this.computeNDotL(v1.WorldCoordinates, v1.Normal, this.lightPos);
                var nl2 = this.computeNDotL(v2.WorldCoordinates, v2.Normal, this.lightPos);
                var nl3 = this.computeNDotL(v3.WorldCoordinates, v3.Normal, this.lightPos);

                //var data = {};
            }
            // computing lines' directions
            var dP1P2;
            var dP1P3;

            // http://en.wikipedia.org/wiki/Slope
            // Computing slopes
            if (p2.y - p1.y > 0)
                dP1P2 = (p2.x - p1.x) / (p2.y - p1.y); else
                dP1P2 = 0;

            if (p3.y - p1.y > 0)
                dP1P3 = (p3.x - p1.x) / (p3.y - p1.y); else
                dP1P3 = 0;

            if (dP1P2 > dP1P3) {
                for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                    data.currentY = y;

                    if (y < p2.y) {
                        if (this.mode == 2) {
                            data.ndotla = nl1;
                            data.ndotlb = nl3;
                            data.ndotlc = nl1;
                            data.ndotld = nl2;
                        }
                    this.processScanLine(data, v1, v3, v1, v2, color);
                    } else {
                        if (this.mode == 2) {
                            data.ndotla = nl1;
                            data.ndotlb = nl3;
                            data.ndotlc = nl2;
                            data.ndotld = nl3;
                        }
                    this.processScanLine(data, v1, v3, v2, v3, color);
                    }
                }
            }
            else {
                for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                    data.currentY = y;

                    if (y < p2.y) {
                        if (this.mode == 2) {
                            data.ndotla = nl1;
                            data.ndotlb = nl2;
                            data.ndotlc = nl1;
                            data.ndotld = nl3;
                        }
                    this.processScanLine(data, v1, v2, v1, v3, color);
                    } else {
                        if (this.mode == 2) {
                            data.ndotla = nl2;
                            data.ndotlb = nl3;
                            data.ndotlc = nl1;
                            data.ndotld = nl3;
                        }
                    this.processScanLine(data, v2, v3, v1, v3, color);
                    }
                }
            }
        };
        Device.prototype.render = function (camera, meshes, mode) {
            var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
            var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);
            this.mode = mode;
            for(var index = 0; index < meshes.length; index++) {
                var cMesh = meshes[index];
                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z).multiply(BABYLON.Matrix.Translation(cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));
                var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                for(var indexFaces = 0; indexFaces < cMesh.Faces.length; indexFaces++) {
                    var currentFace = cMesh.Faces[indexFaces];
                    var vertexA = cMesh.Vertices[currentFace.A];
                    var vertexB = cMesh.Vertices[currentFace.B];
                    var vertexC = cMesh.Vertices[currentFace.C];
                    var pixelA = this.project(vertexA, transformMatrix, worldMatrix);
                    var pixelB = this.project(vertexB, transformMatrix, worldMatrix);
                    var pixelC = this.project(vertexC, transformMatrix, worldMatrix);
                    if (this.mode == 0) {
                        this.drawBline(pixelA, pixelB);
                        this.drawBline(pixelB, pixelC);
                        this.drawBline(pixelC, pixelA);
                    } else {
                        //var color = 0.25 + ((indexFaces % cMesh.Faces.length) / cMesh.Faces.length) *0.75;
                        var color = 1;
                        this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1));
                    }
                    
                }
            }
        };
        Device.prototype.LoadJSONFileAsync = function (fileName, callback) {
            var jsonObject = {
            };
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", fileName, true);
            var that = this;
            xmlhttp.onreadystatechange = function () {
                if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    jsonObject = JSON.parse(xmlhttp.responseText);
                    callback(that.CreateMeshesFromJSON(jsonObject));
                }
            };
            xmlhttp.send(null);
        };
        Device.prototype.CreateMeshesFromJSON = function (jsonObject) {
            var meshes = [];
            for(var meshIndex = 0; meshIndex < jsonObject.meshes.length; meshIndex++) {
                var verticesArray = jsonObject.meshes[meshIndex].vertices;
                var indicesArray = jsonObject.meshes[meshIndex].indices;
                var uvCount = jsonObject.meshes[meshIndex].uvCount;
                var verticesStep = 1;
                switch(uvCount) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                }
                var verticesCount = verticesArray.length / verticesStep;
                var facesCount = indicesArray.length / 3;
                var mesh = new SoftEngine.Mesh(jsonObject.meshes[meshIndex].name, verticesCount, facesCount);
                for(var index = 0; index < verticesCount; index++) {
                    var x = verticesArray[index * verticesStep];
                    var y = verticesArray[index * verticesStep + 1];
                    var z = verticesArray[index * verticesStep + 2];
                    var nx = verticesArray[index * verticesStep + 3];
                    var ny = verticesArray[index * verticesStep + 4];
                    var nz = verticesArray[index * verticesStep + 5];
                    mesh.Vertices[index] = {
                        Coordinates: new BABYLON.Vector3(x, y, z),
                        Normal: new BABYLON.Vector3(nx, ny, nz),
                        WorldCoordinates: null
                    };
                }
                for(var index = 0; index < facesCount; index++) {
                    var a = indicesArray[index * 3];
                    var b = indicesArray[index * 3 + 1];
                    var c = indicesArray[index * 3 + 2];
                    mesh.Faces[index] = {
                        A: a,
                        B: b,
                        C: c
                    };
                }
                var position = jsonObject.meshes[meshIndex].position;
                mesh.Position = new BABYLON.Vector3(position[0], position[1], position[2]);
                meshes.push(mesh);
            }
            return meshes;
        };
        return Device;
    })();
    SoftEngine.Device = Device;    
})(SoftEngine || (SoftEngine = {}));
