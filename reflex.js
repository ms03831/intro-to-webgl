var gl; //for webgl context

//buffers
var colorBuffer;
var vertexBuffer;

//attribute locations
var vertexColor;
var vertexPosition;

//to hold vertices and corresponding colors
var points = [];
var colors = [];
var type;

//default speed, score and size of polygon
var speed = 3;
var score = 0;
var size = 0.4;
var timeRemaining = 30.0 //at start 30 seconds remain

//for storing start and end time of game
var startTime, endTime;
var currentPolyHit = true;
var polygonGenerated = false; //to check if a polygon is generated in current animation

//the player has 3 tries to click before their score is deducted
var lastThree = 3;

//to keep track of when to pause animation
var pauseAnimation = false;

var RED = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN = vec4( 0.0, 1.0, 0.0, 1.0 );

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

    //triggered when canvas is clicked
    canvas.addEventListener("click", function(e){
        checkMousePosition(canvas, e);
    })

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
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

    //get vertex color location
    vertexColor = gl.getAttribLocation( program, "vertexColor" );
    // this tells the attribute how to get data out of color buffer
    gl.vertexAttribPointer( vertexColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexColor );

    //get vertex position location
    vertexPosition = gl.getAttribLocation( program, "vertexPosition" );
    // this tells the attribute how to get data out of vertex buffer
    gl.vertexAttribPointer( vertexPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vertexPosition );

    start(); //this starts the game clock
    render();
}

//this generates a random polygon (triangle or rectangle/square)
function generatePolygon(){
    currentPolyHit = false;
    polygonGenerated = true;
    type = Math.floor(Math.random() * 2); //0 for triangle, 1 for rectangle
    points = [];
    colors = [];
    var randomX = Math.random()*1.4 - 0.4;
    var randomY = Math.random()*1.4 - 0.4;
    var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);

    points.push(vec4(randomX, randomY, 0.0, 1.0));
    points.push(vec4(randomX - size, randomY, 0.0, 1.0));
    if (type == 0){
        points.push(vec4(randomX - size/2, randomY - size, 0.0, 1.0));
        for (let i = 0; i < 3; i++) {
            colors.push(color);
        }
    }
    if (type == 1){
        points.push(vec4(randomX - size, randomY - size, 0.0, 1.0));
        points.push(vec4(randomX - size, randomY - size, 0.0, 1.0));
        points.push(vec4(randomX, randomY - size, 0.0, 1.0));
        points.push(vec4(randomX, randomY, 0.0, 1.0));
        for (let i = 0; i < 6; i++) {
            colors.push(color);
        }
    }
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


function render()
{
    if (!pauseAnimation){
        setTimeout(function() {
            document.getElementById("game-status").innerHTML = "Playing";

            //if current polygon (which means the last here) wasnt hit
            if (!currentPolyHit){
                lastThree--;
            }

            //if no hit in the last three tries: increase size
            // whereas decrease score and speed
            if (lastThree < 1){
                size = ((size < 0.38) ? size + 0.02 : size);
                score--;
                speed = ((speed > 2) ? speed - 1 : speed);
                lastThree = 3;
            }

            document.getElementById("score").innerHTML = score;

            //if player lost or time over
            if (score < 0 || Math.floor(timeRemaining) < 0){
                if (score < 0)
                    document.getElementById("game-status").innerHTML = "Game Over! You lost";
                else
                    document.getElementById("game-status").innerHTML = "Game Over! You won";
                document.getElementById("time").innerHTML = "0 seconds left"
                //end of game so pause animation, clear canvas and return
                pauseAnimation = true;
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                return;
            }

            if (!polygonGenerated) generatePolygon();
            requestAnimationFrame(render);

            //display time remaning and calculate new time remanining
            document.getElementById("time").innerHTML = Math.floor(timeRemaining) + " seconds left";
            timeRemaining = 30 - timeElapsed();

            //clear canvas and render new polygon that was generated
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

            gl.drawArrays(gl.TRIANGLES, 0, points.length);
            polygonGenerated = false; //to generate new polygon in next iteration
        }, 5000/speed);
    }
}

// check if a ray from a point to a fixed direction intersects
// the polygon odd number of times, taken from
//https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon
function isInside(x, y, points, type) {
    var inside = false;
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i][0], yi = points[i][1];
        var xj = points[j][0], yj = points[j][1];
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
};

//check mouse position on click
function checkMousePosition(canvas, e){
    //if the current polygon hasn't been hit already and game is running
    if (!currentPolyHit && score > -1 && timeRemaining > 0){
        currentPolyHit = true; //set to true, player gets 1 try to hit.
        //position of mouse click and mapping it to canvas range
        let canvasRect = canvas.getBoundingClientRect();
        x = e.clientX - canvasRect.left;
        y = e.clientY - canvasRect.top;
        x = mapPoint(0, canvas.width, x, -1, 1);
        y = mapPoint(0, canvas.height, y, 1, -1);

        //check if (x, y) is inside polygon formed by points
        var hit = isInside(x, y, points, type);

        //if hit: decrease size whereas increase score and speed
        if (hit){
            score++;
            speed = ((speed < 10) ? speed + 0.5 : speed);
            size = ((size > 0.2) ? size - 0.05 : size);
        }
        //if doesnt hit: increase size whereas decrease score and speed
        else{
            size = ((size < 0.35) ? size + 0.05 : size);
            if (score > 0) score--;
            speed = ((speed > 2) ? speed - 0.5 : speed);
        }
        //note: size and speed are increased/decreased so as to not go out of bound
        lastThree = 3; //player clicked so reset their tries
        //sleep for quarter of a second before generating a new polygon
        sleep(250);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (!polygonGenerated) generatePolygon();
    }
}

//start clock
function start() {
  startTime = new Date();
};

//get time elapsed since start
function timeElapsed() {
  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms
  // strip the ms
  timeDiff /= 1000;
  // get seconds
  var seconds = Math.round(timeDiff);
  return seconds;
}

//sleep for delay milliseconds
function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}
