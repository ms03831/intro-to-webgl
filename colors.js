var gl;
var colorBuffer;
var triangleVertexBufferObject;
var vertexPosition;
var vertexColor;

var triangleVertices =	[
	vec4(-0.5, -0.5, 0.0, 1.0),
	vec4(0.0, 0.5, 0.0, 1.0),
	vec4(0.5, -0.5, 0.0, 1.0)
];


var RED = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN = vec4( 0.0, 1.0, 0.0, 1.0 );
var BlUE = vec4( 0.0, 0.0, 1.0, 1.0 );

var colors = [RED, GREEN, BlUE];
var interiorColors = [
	RED, GREEN, BlUE
];

var boundaryColors = [
	RED, GREEN, BlUE
];

//Vertex Shader code
var vertexShader = `
attribute vec4 vertexPosition;
attribute vec4 vertexColor;
varying vec4 color;
void main()
{
    gl_Position = vertexPosition;
    gl_PointSize = 5.0;
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

//Sliders for colors for interior vertices
var RI1 = document.getElementById("redI1");
var BI1 = document.getElementById("blueI1");
var GI1 = document.getElementById("greenI1");
var RI2 = document.getElementById("redI2");
var BI2 = document.getElementById("blueI2");
var GI2 = document.getElementById("greenI2");
var RI3 = document.getElementById("redI3");
var BI3 = document.getElementById("blueI3");
var GI3 = document.getElementById("greenI3");

//Sliders for colors for boundary vertices
var RI1 = document.getElementById("redB1");
var BI1 = document.getElementById("blueB1");
var GI1 = document.getElementById("greenB1");
var RI2 = document.getElementById("redB2");
var BI2 = document.getElementById("blueB2");
var GI2 = document.getElementById("greenB2");
var RI3 = document.getElementById("redB3");
var BI3 = document.getElementById("blueB3");
var GI3 = document.getElementById("greenB3");

window.onload = function init(){
	var canvas = document.getElementById('gl-canvas');
	gl = canvas.getContext('webgl');

	if (!gl)
	{
		alert('Your browser does not support WebGL');
	}
	gl.clearColor(0.0, 0.0, 0.0, 0.6);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Create shaders and program
	var program = gl.createProgram();
	var vertShdr = createShaderHelper(vertexShader, true);
    var fragShdr = createShaderHelper(fragShader, false);
    //attach shaders to program
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    gl.useProgram( program );

	// Create buffer
	colorBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    vertexColor = gl.getAttribLocation(program, 'vertexColor');
	gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

	triangleVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
	gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.bufferData(gl.ARRAY_BUFFER, flatten(triangleVertices), gl.STATIC_DRAW);


	gl.enableVertexAttribArray(vertexPosition);
	gl.enableVertexAttribArray(vertexColor);
	render();
};

function getColorValue(element){
	return parseInt(element.value)/255.0;
}

function updateBoundaryColors(){
	var colorV1 = vec4(	getColorValue(redB1),
		 				getColorValue(greenB1),
						getColorValue(blueB1),
		 				1.0
		 		);
	var colorV2 = vec4(	getColorValue(redB2),
		 				getColorValue(greenB2),
						getColorValue(blueB2),
		 				1.0
		 		);
	var colorV3 = vec4(	getColorValue(redB3),
		 				getColorValue(greenB3),
						getColorValue(blueB3),
		 				1.0
		 		);
	boundaryColors = [colorV1, colorV2, colorV3];
}

function updateInteriorColors(){
	var colorV1 = vec4(	getColorValue(redI1),
		 				getColorValue(greenI1),
						getColorValue(blueI1),
		 				1.0
		 		);
	var colorV2 = vec4(	getColorValue(redI2),
		 				getColorValue(greenI2),
						getColorValue(blueI2),
		 				1.0
		 		);
	var colorV3 = vec4(	getColorValue(redI3),
		 				getColorValue(greenI3),
						getColorValue(blueI3),
		 				1.0
		 		);
	interiorColors = [colorV1, colorV2, colorV3];
}


function render(){
	gl.clear(gl.COLOR_BUFFER_BIT);
	var boundary = document.getElementById("boundary");
	var interior = document.getElementById("interior");
	if (boundary.checked == true)
	{
		updateBoundaryColors()
		gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
		console.log("what")
		gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
	    gl.bufferData( gl.ARRAY_BUFFER, flatten(boundaryColors), gl.STATIC_DRAW );
	    gl.drawArrays(gl.LINE_LOOP, 0, triangleVertices.length);
	}

	if (interior.checked == true){
		console.log("what")
		updateInteriorColors()
		gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
		gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
	    gl.bufferData( gl.ARRAY_BUFFER, flatten(interiorColors), gl.STATIC_DRAW );
	    gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length);
	}
};

// var createBuff = function()
// {
// 		//
// 	// Create buffer
// 	//
// 	var triangleVertices =
// 	[ // X, Y,       R, G, B
// 		0.0, 0.5,    1.0, 0.0, 0.0,
// 		-0.5, -0.5,  0.0, 0.0, 1.0,
// 		0.5, -0.5,   0.0, 1.0, 0.0
// 	];

// 	var triangleVertexBufferObject = gl.createBuffer();
// 	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
// 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
// 	gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
//     gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
// 	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
// 	var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

// 	// this tells the attribute how to get data out of vertex buffer
// 	gl.vertexAttribPointer
// 	(
// 		positionAttribLocation, // Attribute location
// 		4, // Number of elements per attribute
// 		gl.FLOAT, // Type of elements
// 		gl.FALSE,
// 		5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
// 		0 // Offset from the beginning of a single vertex to this attribute
// 	);

// 	// this tells the attribute how to get data out of color buffer
// 	gl.vertexAttribPointer
// 	(
// 		colorAttribLocation, // Attribute location
// 		3, // Number of elements per attribute
// 		gl.FLOAT, // Type of elements
// 		gl.FALSE,
// 		5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
// 		2 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
// 	);

// 	gl.enableVertexAttribArray(positionAttribLocation);
// 	gl.enableVertexAttribArray(colorAttribLocation);


// 	// Main render loop

// 	gl.useProgram(program);
// }


function createShaderHelper(sourceString, vertex = true){
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) : gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}
