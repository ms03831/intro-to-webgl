var gl; //for webgl context

//buffers
var colorBuffer;
var triangleVertexBufferObject;

//attribute locations
var vertexPosition;
var vertexColor;

//triangle vertices
var triangleVertices =	[
	vec4(-0.5, -0.5, 0.0, 1.0),
	vec4(0.0, 0.5, 0.0, 1.0),
	vec4(0.5, -0.5, 0.0, 1.0)
];

//initially boundary and interior vertices are similar to maxwell's triangle
var RED = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN = vec4( 0.0, 1.0, 0.0, 1.0 );
var BlUE = vec4( 0.0, 0.0, 1.0, 1.0 );

//draws interior by default
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
	//get canvas and webgl context
	var canvas = document.getElementById( "gl-canvas" );
	gl = canvas.getContext("webgl");
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    //clear canvas
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

	// Create buffers
	colorBuffer = gl.createBuffer();
	triangleVertexBufferObject = gl.createBuffer();

	//bind color buffer
	gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    vertexColor = gl.getAttribLocation(program, 'vertexColor');
    // this tells the attribute how to get data out of color buffer
	gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
	//draws interior by default
    gl.bufferData( gl.ARRAY_BUFFER, flatten(interiorColors), gl.STATIC_DRAW );

	//bind vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
	vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
    // this tells the attribute how to get data out of vertex buffer
	gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.bufferData(gl.ARRAY_BUFFER, flatten(triangleVertices), gl.STATIC_DRAW);

	gl.enableVertexAttribArray(vertexPosition);
	gl.enableVertexAttribArray(vertexColor);

	render();
};

//get value correponding to slider element and map it to [0, 1]
function getColorValue(element){
	return parseInt(element.value)/255.0;
}

//update boundary colors when boudary sliders are changed
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

//update interior colors when interior sliders are changed
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

//this function is called at start and each time
//a value of slider or switch changes
function render(){
	gl.clear(gl.COLOR_BUFFER_BIT);

	//get switches for boundary and interior
	var boundary = document.getElementById("boundary");
	var interior = document.getElementById("interior");

	if (boundary.checked == true)
	{
		updateBoundaryColors()
		//bind buffer again for updated colors
		gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
		gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
	    gl.bufferData( gl.ARRAY_BUFFER, flatten(boundaryColors), gl.STATIC_DRAW );
	    gl.drawArrays(gl.LINE_LOOP, 0, triangleVertices.length);
	}

	if (interior.checked == true){
		updateInteriorColors()
		//bind buffer again for updated colors
		gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
		gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
	    gl.bufferData( gl.ARRAY_BUFFER, flatten(interiorColors), gl.STATIC_DRAW );
	    gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length);
	}
};

//helper function for creating a shader from its source string
function createShaderHelper(sourceString, vertex = true){
    //if vertex shader, create vertex shader else framgent shader
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) :
                            gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}
