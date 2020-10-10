var axis = 0; // 0 for X, 1 for Y, 2 for Z, -1 for no rotation
var angleX = 0; //initially the angle is zero
var angleY = 0;
var angleZ = 0;
var points = [];
var colors = [];
var colorBuffer;
var gl;
var vertexBuffer;
var vertexColor;
var vertexPosition;
var subdivisionLevel = 1;
// for location of rotationMatrix on GPU
var rotationMatrixLoc;

//default rotation matrix, which doesn't rotate the point
var rotationCPU = mat4(
                    1.0,  0.0, 0.0, 0.0,
                    0.0,  1.0, 0.0, 0.0,
                    0.0,  0.0, 1.0, 0.0,
                    0.0,  0.0, 0.0, 1.0
                );

// initial vertices to make a regular tetrahedron, vertices calculated as
// outlined here https://en.wikipedia.org/wiki/Tetrahedron#Coordinates_for_a_regular_tetrahedron
var vertices = [
    vec4(  0.9428,     0.0, -0.33, 1.0 ) ,
    vec4( -0.4714,  0.8165, -0.33, 1.0 ),
	vec4( -0.4714, -0.8165, -0.33, 1.0 ),
    vec4(     0.0,     0.0,   1.0, 1.0 )
];

var RED     = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN   = vec4( 0.0, 1.0, 0.0, 1.0 );
var BLUE    = vec4( 0.0, 0.0, 1.0, 1.0 );
var BLACK   = vec4( 0.0, 0.0, 0.0, 0.3 );

//Vertex Shader code
var vertexShader = `
attribute vec4 vertexPosition;
attribute vec4 vertexColor;
varying vec4 color;
uniform mat4 rotationMatrix;
void main()
{
	gl_Position = rotationMatrix * vertexPosition;
	color = vertexColor;
}
`

//Fragment Shader code
var fragShader = `
precision mediump float;
varying vec4 color;
void main()
{
	gl_FragColor = color;
}
`

window.onload = function init(){
	var canvas = document.getElementById( "gl-canvas" );
	gl = canvas.getContext("webgl");
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    document.getElementById("x-axis").onclick = function() { axis = 0; } //angleX = 0 };
    document.getElementById("y-axis").onclick = function() { axis = 1; } //angleY = 0 };
    document.getElementById("z-axis").onclick = function() { axis = 2; } //angleZ = 0 };
    document.getElementById("no-axis").onclick = function() { axis = -1; }//angleX = 0; angleY = 0; angleZ = 0; };

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    var program = gl.createProgram();
    var vertShdr = createShaderHelper(vertexShader, true);
    var fragShdr = createShaderHelper(fragShader, false);

    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    gl.useProgram( program );

    colorBuffer = gl.createBuffer();
    vertexBuffer = gl.createBuffer();

    // Bind the color buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    vertexColor = gl.getAttribLocation( program, "vertexColor" );
    // this tells the attribute how to get data out of color buffer
    gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexColor );

    // Bind the vertex position buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    vertexPosition = gl.getAttribLocation( program, "vertexPosition" );
    // this tells the attribute how to get data out of vertex buffer
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    rotationMatrixLoc = gl.getUniformLocation(program, "rotationMatrix");
    var slider = document.getElementById('slider');
    slider.onchange = function() {
        subdivisionLevel = slider.value;
        points = [];
        colors = [];
        document.getElementById("lvl").innerHTML = subdivisionLevel;
        tetrixRecursive(vertices[0], vertices[1], vertices[2], vertices[3], subdivisionLevel);
    }
    tetrixRecursive(vertices[0], vertices[1], vertices[2], vertices[3], subdivisionLevel);
    render();
}

function createShaderHelper(sourceString, vertex = true){
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) : gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}

// to calculate the mid-point of vertices a and b
function midPoint(a, b){
    mid = [];
    for (let i = 0; i < a.length; i++) mid.push((a[i] + b[i])/2);
    return mid;
}

/* main function for recursive division, takes four points
of the tetrahedron and divides it into more tetrahedrons
until level 0 is reached.
*/
function tetrixRecursive(left, right, top, back, level){
    if (level == 0){
        tetrix(left, right, top, back);
        return;
    }
    else{
        var leftRight = midPoint(left, right);
        var leftTop = midPoint(left, top);
        var leftBack = midPoint(left, back);
        tetrixRecursive( left, leftRight, leftTop, leftBack, level - 1);
        var rightTop = midPoint(right, top);
        var rightBack = midPoint(right, back);
        tetrixRecursive( leftRight, right, rightTop, rightBack, level - 1);
        var topBack = midPoint(top, back);
        tetrixRecursive( leftTop, rightTop, top, topBack, level - 1);
        tetrixRecursive( leftBack, rightBack, topBack, back, level - 1);
    }
}

function tetrix(left, right, top, back){
    triangle(left, right, top, RED);
    triangle(right, top, back, BLUE);
    triangle(top, back, left, GREEN);
    triangle(back, left, right, BLACK);
}

function triangle(left, right, top, color){
    points.push(left, right, top);
    colors.push(color, color, color);
}


function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    switch (axis) {
        case -1:
//            angleX = angleY = angleZ = 0;
            break;
        case 0:
            angleX += 1;
            break;
        case 1:
            angleY += 1;
            break;
        case 2:
            angleZ += 1;
            break;
    };

    // Bind the color buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    // this tells the attribute how to get data out of color buffer
    //gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    // Bind the vertex position buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    // this tells the attribute how to get data out of vertex buffer
    //gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    rotationCPU = getRotationMatrix()
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationCPU));
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
    requestAnimationFrame(render);
}

function getRotationMatrix(){
    return mult(rotateZ(angleZ), mult(rotateY(angleY), rotateX(angleX)))
}
