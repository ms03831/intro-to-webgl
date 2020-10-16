var gl; //for webgl context
var axis = 0; // 0 for X, 1 for Y, 2 for Z, -1 for no rotation

//angles for rotation along different axes, initially its zero
var angleX = 0;
var angleY = 0;
var angleZ = 0;

//to hold vertices and corresponding colors
var points = [];
var colors = [];

//buffers
var colorBuffer;
var vertexBuffer;

//attribute locations
var vertexColor;
var vertexPosition;

//number of times to subdivide tetrix, by default 1
var subdivisionLevel = 1;

// for location of rotationMatrix on GPU
var rotationMatrixLoc;

//vertices of a tetrahedron, back means one thats into the page
var left, right, top, back;

//these four triangular faces make up a tetrahedron
var triangles = [
    0, 1, 2,
    1, 2, 3,
    2, 3, 0,
    3, 0, 1
]

//default rotation matrix, which doesn't rotate the point
var rotationCPU = mat4(
                    1.0,  0.0, 0.0, 0.0,
                    0.0,  1.0, 0.0, 0.0,
                    0.0,  0.0, 1.0, 0.0,
                    0.0,  0.0, 0.0, 1.0
                );

//initial vertices for a regular tetrahedron, vertices calculated as outlined here
//https://en.wikipedia.org/wiki/Tetrahedron#Coordinates_for_a_regular_tetrahedron
var vertices = [
    vec4(0.0000, 0.0000, 1.0000, 1.0),
    vec4(0.0000, 0.9428, -0.3333, 1.0),
    vec4(-0.8165, -0.4714, -0.3333, 1.0),
    vec4(0.8165, -0.4714, -  0.3333, 1.0),
];

//primary colors to color each face of a tetrahedron
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
    //get canvas and webgl context
    var canvas = document.getElementById( "gl-canvas" );
    gl = canvas.getContext("webgl");
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    //to change the axis of rotation
    document.getElementById("x-axis").onclick = function() { axis = 0; }
    document.getElementById("y-axis").onclick = function() { axis = 1; }
    document.getElementById("z-axis").onclick = function() { axis = 2; }
    document.getElementById("no-axis").onclick = function() { axis = -1; }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST); //enable depth

    //create shaders and attach them to program
    var program = gl.createProgram();
    var vertShdr = createShaderHelper(vertexShader, true);
    var fragShdr = createShaderHelper(fragShader, false);
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    gl.useProgram( program );

    //populates points and colors for the default subdivision level
    tetrixRecursive(vertices[0], vertices[1], vertices[2], vertices[3],
                    subdivisionLevel);

    //create buffers
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

    //get rotation matrix location in the program
    rotationMatrixLoc = gl.getUniformLocation(program, "rotationMatrix");

    //changing level of subdivision when the value on slider changes
    var slider = document.getElementById('slider');
    slider.onchange = function() {
        subdivisionLevel = slider.value;
        points = [];
        colors = [];
        document.getElementById("lvl").innerHTML = subdivisionLevel;
        //populates points and colors for the new subdivision level
        tetrixRecursive(vertices[0], vertices[1], vertices[2], vertices[3],
                        subdivisionLevel);
        // Bind the buffers again and provide new data
        gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    }
    render();
}

//helper function for creating a shader from its source string
function createShaderHelper(sourceString, vertex = true){
    //if vertex shader, create vertex shader else framgent shader
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) :
                            gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}

// to calculate the mid-point of vertices a and b
function midPoint(a, b){
    return mix(a, b, 0.5);
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
        //each tetra is divided into four tetras
        //mid points of all edges of a tetra; leftRight denotes midpoint of
        //edge between left and right vertices and so on
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

//this populates the colors and points arrays with the
//vertex position and color of the vertices of the tetrahedron
function tetrix(left, right, top, back){
    //for ease of access we assign a index to each vertex
    var vertexIndices = {
        0: left,
        1: right,
        2: top,
        3: back
    }

    //iterate on the triangular faces outlined at the top of the file
    //some combination of vertices make a face, and tetrix is made up
    //of four such faces
    for (let i = 0; i < triangles.length; i++)
        points.push(vertexIndices[triangles[i]]);

    //colors for each face
    colors.push(RED, RED, RED);
    colors.push(BLUE, BLUE, BLUE);
    colors.push(GREEN, GREEN, GREEN);
    colors.push(BLACK, BLACK, BLACK);
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //depending on axis of rotation, increase the angle so as to rotate
    switch (axis) {
        case -1:
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

    //get the rotation matrix corresponding to current angles of rotation
    rotationCPU = getRotationMatrix()

    //tell the vertex shader to use this new rotation matrix to compute vertices
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationCPU));
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
    requestAnimationFrame(render);
}

//This gets the rotation matrix corresponding to current angles of rotation
function getRotationMatrix(){
    return mult(rotateZ(angleZ), mult(rotateY(angleY), rotateX(angleX)))
}
