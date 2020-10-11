var gl;
var colorBuffer;
var vertexBuffer;
var vertexColor;
var vertexPosition;
var points;
var type;
var colors;
var speed = 3;
var score = 0;
var size = 0.4;
var timeRemaining = 30.0
var RED = vec4( 1.0, 0.0, 0.0, 1.0 );
var GREEN = vec4( 0.0, 1.0, 0.0, 1.0 );
var startTime, endTime;
var currentPolyHit = true;
var lastThree = 3;
var pauseAnimation = false;

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
        checkMousePosition(canvas, e);
    })

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
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
    start();
    render();
}

function generatePolygon(){
    currentPolyHit = false;
    type = Math.floor(Math.random() * 2); //0 for triangle, 1 for rectangle
    points = [];
    colors = [];
    var randomX = Math.random()*1.4 - 0.4;
    var randomY = Math.random()*1.4 - 0.4;
    var colorAlpha = Math.random() + 0.01;
    var color = vec4(mapPoint(0, 1, colorAlpha, RED, GREEN));
    points.push(vec4(randomX, randomY, 0.0, 1.0));
    points.push(vec4(randomX - size, randomY, 0.0, 1.0));
    if (type == 0){
        points.push(vec4(randomX - size/2, randomY - size, 0.0, 1.0));
        for (let i = 0; i < 3; i++) colors.push(color);
    }
    if (type == 1){
        points.push(vec4(randomX - size, randomY - size, 0.0, 1.0));
        points.push(vec4(randomX - size, randomY - size, 0.0, 1.0));
        points.push(vec4(randomX, randomY - size, 0.0, 1.0));
        points.push(vec4(randomX, randomY, 0.0, 1.0));
        for (let i = 0; i < 6; i++) colors.push(color);
    }
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
    if (!pauseAnimation){
        setTimeout(function() {
            if (!currentPolyHit){
                lastThree--;
            }

            if (lastThree < 1){
                size = ((size < 0.38) ? size + 0.02 : size);
                score--;
                speed = ((speed > 2) ? speed - 1 : speed);
                lastThree = 3;
            }

            generatePolygon();
            requestAnimationFrame(render);
            timeRemaining = 30 - timeElapsed();
            //console.log(timeRemaining);
            document.getElementById("time").innerHTML = "00:" + Math.floor(timeRemaining);
            document.getElementById("score").innerHTML = score;

            if (score < 0 || Math.floor(timeRemaining) < 0){
                if (score < 0) document.getElementById("game-status").innerHTML = "Game Over! You lost";
                else document.getElementById("game-status").innerHTML = "Game Over! You won";
                document.getElementById("time").innerHTML = "00:00"
                pauseAnimation = true;
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                return;
            }

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
        }, 5000/speed);
    }
}

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

function checkMousePosition(canvas, e){
    if (!currentPolyHit && score > -1 && timeRemaining > 0){
        currentPolyHit = true;
        let canvasRect = canvas.getBoundingClientRect();
        x = e.clientX - canvasRect.left;
        y = e.clientY - canvasRect.top;
        x = mapPoint(0, canvas.width, x, -1, 1);
        y = mapPoint(0, canvas.height, y, 1, -1);
        var hit = isInside(x, y, points, type);
        if (hit){
            score++;
            speed = ((speed < 10) ? speed + 1 : speed);
            lastThree = 3;
            size = ((size > 0.18) ? size - 0.02 : size);
        }
        else{
            size = ((size < 0.38) ? size + 0.02 : size);
            score--;
            speed = ((speed > 2) ? speed - 1 : speed);
        }
    }
}

function start() {
  startTime = new Date();
};

function timeElapsed() {
  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms
  // strip the ms
  timeDiff /= 1000;
  // get seconds
  var seconds = Math.round(timeDiff);
  return seconds;
}
