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

    gl.drawArrays( gl.TRIANGLES, 0, triangleVertices.length);
};


function createShaderHelper(sourceString, vertex = true){
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) : gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}
