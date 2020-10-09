var gl;
var points = [];
var colors = [];
var colorBuffer;
var vertexBuffer;
var vertexColor;
var vertexPosition;
var threshold = 50;
var width;
var height;

var RED = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN = vec4( 0.0, 1.0, 0.0, 1.0 );
var BLUE = vec4( 0.0, 0.0, 1.0, 1.0 );

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
	var canvas = document.getElementById( "gl-canvas" );
	gl = canvas.getContext("webgl");
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }
    // width and height of image to generate a complex grid for values of c
    width = canvas.width;
    height = canvas.height;    
    gl.viewport( 0, 0, width, height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
 
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

    var slider = document.getElementById('slider');
    slider.onchange = function() {
        threshold = slider.value;
        points = []; 
        colors = [];
        document.getElementById("threshold").innerHTML = threshold;
        mandelbrot(threshold);
        render();
    }
    mandelbrot(threshold);    
    render();
}

function createShaderHelper(sourceString, vertex = true){
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) : gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}

/* 
maps color based on ecape time values P and Q and also maps 
pixel space range [width, height] to clip space range [-1, 1] 
*/
function mapPoint(P, Q, X, A, B){
    var alpha = (((Q-P)*(Q-P) > 0 ) ? (X - P)/(Q - P) : 0);
    var result;
    if (typeof P == "number" && typeof A == "number"){
        result = alpha*B + (1 - alpha)*A;
    }
    else{
        result = [];
        for (let i = 0; i < A.length; i++){
            result.push(alpha*B[i] + (1 - alpha)*A[i])
        }
    }
    if (isNaN(result)){
        //console.log(alpha, P, Q, X, A, B, result)
    }
    return result
}

/*
calculates the escape time of a complex number c, 
the function takes the following two arguments:
c: an array of the form [re, im] where re is the real part of c whereas im 
is the imaginary part  
threshold: maximum number of iterations
*/
function mandelbrotEscapeTime(c, threshold){
    z = [0, 0] //start from zero
    for (let i = 0; i <= threshold; i++){
        //the moment it goes outside the circle, that's the escape time
        magnitude = Math.sqrt(z[0]*z[0] + z[1]*z[1]) 
        if (magnitude >= 2.0)
            return i;
        real = z[0];
        imag = z[1];
        z = [real*real - imag*imag + c[0], 2*real*imag + c[1]]
    }
    //to siginfy points that don't escape till threshold
    return -1
}

/* 
main function for computing mandelbrot points
and mapping each point to a color according
to its escape time.
*/
function mandelbrot(threshold){
    //(i, j) serve as pixel coordinates whereas (x, y) form the complex number c
    for (let x = 0; x < width; x++){
        for (let y = 0; y < height; y++){
            mappedX = mapPoint(0, width, x, -2, 2)
            mappedY = mapPoint(0, height, y, -2, 2)
            c = [mappedX, mappedY]
            escapeTime = mandelbrotEscapeTime(c, threshold)
            clipX = mapPoint(0, width, x, -1, 1)
            clipY = mapPoint(0, height, y, 1, -1)
            points.push(vec4(clipX, clipY, 0.0, 1.0))
            if (escapeTime == 1){
                colors.push(RED); //early escape then red
            }
            else if (escapeTime == -1){
                colors.push(BLUE); //doesn't escape till threshold then BLUE
                //alert("yes")
            }
            else{
                if (escapeTime < threshold/4)
                    color = mapPoint(1, threshold/4, escapeTime, RED, GREEN);
                else
                    color = mapPoint(threshold/4, threshold, escapeTime, GREEN, BLUE);
                colors.push(vec4(color));
            }
            
        }
    }
}


function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Bind the color buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    // Bind the vertex position buffer. 
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    gl.drawArrays(gl.POINTS, 0, points.length);
    console.log(points)
}

