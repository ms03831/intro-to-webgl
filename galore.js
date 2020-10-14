var TRIANGLE_MODE = 0;
var QUAD_MODE = 1;
var gl;
var colorBuffer;
var vertexBuffer;
var vertexColor;
var vertexPosition;
//to temporarily store the points till the polygon is drawn
var tempPoints = [];
var points = [];
var mode = TRIANGLE_MODE;
var colors = [];
var nTriangles = 0;
var nQuads = 0;
var tempColors = [];
//to keep track of which polygons (triangle or quad) is drawn throughout the session
var polygons = [];
//to not draw everything from the start
var currentPos = 0;

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

    canvas.addEventListener("click", function(e){
        let canvasRect = canvas.getBoundingClientRect();
        x = e.clientX - canvasRect.left;
        y = e.clientY - canvasRect.top;
        x = mapPoint(0, canvas.width, x, -1, 1);
        y = mapPoint(0, canvas.height, y, 1, -1);
        var point = vec4(x, y, 0.0, 1);
        points.push(point);
        tempPoints.push(point);
        addColor();
        if (tempPoints.length == 3 && mode == TRIANGLE_MODE) {
            tempPoints = [];
            tempColors = [];
            nTriangles += 1;
        }
        if (tempPoints.length == 4 && mode == QUAD_MODE) {
            //a quad is basically two triangles
            points.push(tempPoints[0], tempPoints[2]);
            colors.push(tempColors[0], tempColors[2]);
            nQuads += 1;
            tempPoints = [];
            tempColors = [];
        }
        render();
    })

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 0.6 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    var program = gl.createProgram();
    var vertShdr = createShaderHelper(vertexShader, true);
    var fragShdr = createShaderHelper(fragShader, false);

    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    gl.useProgram( program );

    colorBuffer = gl.createBuffer();
    vertexBuffer = gl.createBuffer();

    vertexColor = gl.getAttribLocation( program, "vertexColor" );
    // this tells the attribute how to get data out of color buffer
    gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexColor );

    vertexPosition = gl.getAttribLocation( program, "vertexPosition" );
    // this tells the attribute how to get data out of vertex buffer
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    document.onkeydown = function(event){
        //reset
        if (event.key === 'R' || event.key === 'r'){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            mode = TRIANGLE_MODE;
            points = [];
            tempPoints = [];
            colors = [];
            nQuads = nTriangles = 0;
            polygons = [];
            currentPos = 0;
        }
        //switch mode
        else if (event.key === 'T' || event.key === 't'){
            if (tempPoints.length == 3 && mode == QUAD_MODE) {
            //a quad is basically two triangles
            nTriangles += 1;
            tempPoints = [];
            tempColors = [];
            }
            mode = 1 - mode;
        }
    }
    render();
    //if (mode == QUAD_MODE) currentPos += 3;
}

function addColor(){
    var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
    tempColors.push(color);
    colors.push(color);
}

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
    return result
}

function createShaderHelper(sourceString, vertex = true){
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) : gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}


function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (tempPoints.length > 0){
        // Bind the color buffer.
        gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
        // this tells the attribute how to get data out of color buffer
        gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(tempColors), gl.STATIC_DRAW );
        // Bind the vertex position buffer.
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        // this tells the attribute how to get data out of vertex buffer
        gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(tempPoints), gl.STATIC_DRAW );
        gl.drawArrays(gl.POINTS, 0, tempPoints.length);
    }

    // Bind the color buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    // this tells the attribute how to get data out of color buffer
    gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    // Bind the vertex position buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    // this tells the attribute how to get data out of vertex buffer
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    // var numPoints = mode*3 + 3;
    // currentPos = ((nQuads*6 + nTriangles*3 == 0) ? 0: nQuads*6 + nTriangles*3 - numPoints);
    // gl.drawArrays( gl.TRIANGLES, currentPos, numPoints);
    if (mode == QUAD_MODE && tempPoints.length < 4) {
        gl.drawArrays( gl.TRIANGLES, 0, points.length - tempPoints.length);
    }
    else {
        gl.drawArrays( gl.TRIANGLES, 0, points.length);
    }
    requestAnimationFrame(render);
}

