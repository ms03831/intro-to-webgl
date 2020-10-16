var gl; //for webgl context

//to hold vertices and corresponding colors
var points = [];
var colors = [];

//buffers
var colorBuffer;
var vertexBuffer;

//different modes
var TRIANGLE_MODE = 0;
var QUAD_MODE = 1;

//to temporarily store the points and colors till the polygon is drawn
var tempPoints = [];
var tempColors = [];

//default mode is triangle
var mode = TRIANGLE_MODE;

//number of triangles and quads drawn
var nTriangles = 0;
var nQuads = 0;

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
    //get canvas and webgl context
    var canvas = document.getElementById( "gl-canvas" );
    gl = canvas.getContext("webgl");
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    //this event is triggered when a user clicks on canvas
    //this adds a point
    canvas.addEventListener("click", function(e){
        //coorindates of click mapped to webgl canvas range
        let canvasRect = canvas.getBoundingClientRect();
        x = e.clientX - canvasRect.left;
        y = e.clientY - canvasRect.top;
        x = mapPoint(0, canvas.width, x, -1, 1);
        y = mapPoint(0, canvas.height, y, 1, -1);

        //add point and color
        var point = vec4(x, y, 0.0, 1);
        points.push(point);
        tempPoints.push(point);
        addColor();

        //if 3 points have been drawn and mode is triangle
        //reset tempPoints and tempColors
        if (tempPoints.length == 3 && mode == TRIANGLE_MODE) {
            tempPoints = [];
            tempColors = [];
            nTriangles += 1;
        }

        //if 4 points have been drawn and mode is Quad
        //reset tempPoints and tempColors
        if (tempPoints.length == 4 && mode == QUAD_MODE) {
            //a quad is basically two triangles
            points.push(tempPoints[0], tempPoints[2]);
            colors.push(tempColors[0], tempColors[2]);
            tempPoints = [];
            tempColors = [];
            nQuads += 1;
        }
        render();
    })

    //setting up canvas and clearing it
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 0.6 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //create shaders and attach them to program
    var program = gl.createProgram();
    var vertShdr = createShaderHelper(vertexShader, true);
    var fragShdr = createShaderHelper(fragShader, false);
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );
    gl.useProgram( program );

    //create buffers
    colorBuffer = gl.createBuffer();
    vertexBuffer = gl.createBuffer();

    //locations of vertex color and position
    vertexColor = gl.getAttribLocation( program, "vertexColor" );
    vertexPosition = gl.getAttribLocation( program, "vertexPosition" );

    // this tells the attribute how to get data out of color buffer
    gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexColor );

    // this tells the attribute how to get data out of vertex buffer
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    //triggered if a key is pressed
    document.onkeydown = function(event){
        //reset
        if (event.key === 'R' || event.key === 'r'){
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            mode = TRIANGLE_MODE;
            points = [];
            tempPoints = [];
            colors = [];
            nQuads = nTriangles = 0;
        }
        //switch mode
        else if (event.key === 'T' || event.key === 't'){
            //if mode is changed to triangle while 3 points have been drawn
            if (tempPoints.length == 3 && mode == QUAD_MODE) {
                nTriangles += 1;
                tempPoints = [];
                tempColors = [];
            }
            mode = 1 - mode; //mode is toggled
        }
    }
    render();
}

//add random color for a vertex
function addColor(){
    var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
    tempColors.push(color);
    colors.push(color);
}

//map point from homework 2, used for interpolating
//color value as well as clipping coordinates between
//a range e.g mouse position to canvas range [-1, 1]
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

//helper function for creating a shader from its source string
function createShaderHelper(sourceString, vertex = true){
    //if vertex shader, create vertex shader else framgent shader
    var shader = ((vertex) ? gl.createShader( gl.VERTEX_SHADER ) :
                            gl.createShader( gl.FRAGMENT_SHADER ));
    gl.shaderSource( shader, sourceString );
    gl.compileShader( shader );
    return shader;
}

//called at the start and whenever a new point is drawn
function render()
{
    //clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //to draw points that havent yet formed a polygon
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

    //if quad mode and points still being drawn then dont draw the last points
    //(because the last points may make up a triangle)
    if (mode == QUAD_MODE && tempPoints.length < 4) {
        gl.drawArrays( gl.TRIANGLES, 0, points.length - tempPoints.length);
    }

    else {
        gl.drawArrays( gl.TRIANGLES, 0, points.length);
    }

    requestAnimationFrame(render);
}

