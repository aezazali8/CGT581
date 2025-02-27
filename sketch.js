let serial;
let latestData = [512, 0, 0, 1]; // [steering, accel, brake, gear]
let carX, carY;
let carAngle = 0;
let speed = 0;
let maxSpeed = 1.5;
let carSize = 60;
let hit = false;
let testStatus = ""; //  "Test Passed" or "Test Failed"
let isDrive = 1;
let gameStarted = false;
let startTime = 0;
let elapsedTime = 0;
let showModal = false;
let modalText = "";
let engineSound, crashSound, winSound;

function preload() {
  soundFormats('mp3');
  engineSound = loadSound('car.mp3');
  crashSound = loadSound('crash.mp3');
  winSound = loadSound('win.mp3');
}


let obstacles = [
  { x: 120, y: 230, size: 30 },
  { x: 470, y: 320, size: 30 },
  { x: 300, y: 330, size: 30 },
  { x: 350, y: 225, size: 30 },
  { x: 150, y: 310, size: 30 }
];

let parkedCars = [
  { x: 145, y: 130, color: 'black',  size: 70  },
  { x: 470, y: 130, color: 'black',  size: 70  },
  { x: 300, y: 400, color: 'black',  size: 70  },
  { x: 150, y: 400, color: 'white',  size: 70  },
  { x: 380, y: 150, color: 'white',  size: 70  }
];


let parkingZone = { x: 220, y: 400, w: 60, h: 80 };



function setup() {
  createCanvas(600, 600);
  
  serial = new p5.SerialPort();
  serial.list();
  serial.open("COM5"); 

// serial.on('connected', serverConnected);
 // serial.on('list', gotList);
  serial.on('data', gotData);
 // serial.on('error', gotError);
  //serial.on('open', gotOpen);
  //serial.on('close', gotClose);

  carX = 550;
  carY = 120;

  startCountdown(); //LED countdown at the beginning
}

function draw() {
  background(180); 

  drawObstaclesAndParking();
  checkCollisions();
  handleCarMovement();
  drawCar(carX, carY, carAngle);
  displayGameStatus();

  if (gameStarted) {
    fill(255);
    textSize(20);
    text("Time: " + ((millis() - startTime) / 1000).toFixed(2) + "s", width / 2, 100); //chatgpt for timing and formatting
  } else if (elapsedTime > 0) {
    fill(255, 255, 0);
    textSize(24);
    text("Final Time: " + (elapsedTime / 1000).toFixed(2) + "s", width / 2, 100);
  }

  if (showModal) {
  fill(0, 0, 0, 200); 
    rect(0, 0, width, height);
    fill(255);
    textSize(40);
    textAlign(CENTER, CENTER);
    text(modalText, width / 2, height / 2);  
    }
}




// CHATGPT code for settimeout
function startCountdown() {
  setTimeout(() => { 
    serial.write('R'); // Red LED ON
  }, 0);

  setTimeout(() => { 
    serial.write('Y'); // Red OFF, Yellow ON
  }, 1000);

  setTimeout(() => { 
    serial.write('G'); // Yellow OFF, Green ON
    gameStarted = true;
    startTime = millis(); // Start the timer
  }, 2000);
}

function drawParkingLines() {

}


function drawObstaclesAndParking() {
  
  stroke(244);
  strokeWeight(8);
  for (let i = 100; i <= width - 100; i += 80) { 
    line(i, 50, i, height - 400); 
    line(i, 350, i, height - 100); 
  }
  line(100, 200, 500, 200);
  line(100, 350, 500, 350);
  strokeWeight(1);
  
  //zone 
  noFill();
  stroke(0, 255, 0);
  strokeWeight(5);
  drawingContext.setLineDash([9, 9]);
  rect(parkingZone.x - parkingZone.w / 2, parkingZone.y - parkingZone.h / 2, parkingZone.w, parkingZone.h);
  drawingContext.setLineDash([]);
  strokeWeight(1);

    //cars
  for (let car of parkedCars) {
      drawCar(car.x, car.y, 0, car.color);
  }

  for (let obs of obstacles) {
    push();
    translate(obs.x, obs.y);
    fill(230, 120, 0);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, 25, 25, 5); 
    // white & orange
    for (let i = 0; i < 4; i++) {
      fill(i % 2 === 0 ? 255 : color(255, 165, 0));
      ellipse(0, 0, obs.size * (0.6 - i * 0.15));
    }
    pop();
  stroke(0, 0, 0);
  }
}

function checkCollisions() {
  for (let obs of [...obstacles, ...parkedCars]) {
    let d = Math.sqrt((carX - obs.x) ** 2 + (carY - obs.y) ** 2);
    if (d < obs.size / 2 + carSize / 2) {
      if (!hit) {
        testStatus = "Test Failed"; 
        hit = true;
        speed = 0;
        showModal = true;
        modalText = "PARKING FAILED";
        engineSound.stop();
        crashSound.play(); 
      }
      return;
    }
  }

  if (
    carX > parkingZone.x - parkingZone.w / 2 &&
    carX < parkingZone.x + parkingZone.w / 2 &&
    carY > parkingZone.y - parkingZone.h / 2 &&
    carY < parkingZone.y + parkingZone.h / 2 &&
    speed === 0 && gameStarted
  ) {
    if (!showModal) {
      gameStarted = false;
      let finalScore = ((millis() - startTime) / 1000).toFixed(2);
      showModal = true;
      modalText = `PARKED!\nScore: ${finalScore} sec`;
      engineSound.stop();
      winSound.play(); 
      serial.write('S'); // to Arduino
    }
  }
}
function handleCarMovement() {
  let steering = map(latestData[0], 0, 1023, -PI / 4, PI / 4);
  let isDrive = !latestData[3];
  ////////////////////LDR Callibration///////////////////////////////////////
  let accel = map(latestData[1], 550, 780, 0, maxSpeed);
  if (latestData[2] >= 600) { 
  ///////////////////////////////////////////////////////////////////////////
    speed = 0;
    engineSound.stop(); 
  } else if (accel > 0) {
    speed = isDrive ? accel : -accel;
    if (!engineSound.isPlaying()) {
      engineSound.loop();
    }
  }


  let nextX = carX + speed * sin(carAngle);
  let nextY = carY - speed * cos(carAngle);

  if (nextX - carSize / 2 < 0 || nextX + carSize / 2 > width) {
    speed = 0;
  } else {
    carX = nextX;
  }

  if (nextY - carSize / 2 < 0 || nextY + carSize / 2 > height) {
    speed = 0;
  } else {
    carY = nextY;
  }

  if (speed) {
    let direction = isDrive ? 1 : -1;
    /////////////////////////////steering callibration///////////////////
    carAngle += direction * steering * 0.025;
    /////////////////////////////////////////////////////////////////////
  }
}


function drawCar(x, y, angle, carcolor = red) {
  push();
  stroke('black')
  translate(x, y);
  rotate(angle);
  fill(255, 255, 255);
  rect(-25, -47, 15, 3, 5);
  rect(0, -47, 15, 3, 5);
  fill(255,0,0);
if (carcolor === 'white') fill(255, 255, 255);
if (carcolor === 'black') fill(0, 0, 0);
  rect(-30, -45, 50, 90, 7);
  fill(0, 0, 110);
  rect(-28, -30, 46, 20, 5);
  fill(150, 0, 0);
if (carcolor === 'white') fill(200 , 200, 200);
if (carcolor === 'black') fill(50, 50, 50);
  rect(-28, 5, 46, 37, 5);
  stroke(110, 0, 0);
if (carcolor === 'white') stroke(230, 230, 230);
if (carcolor === 'black') stroke(30, 30, 30);
  strokeWeight(3);
  line(-20, 10, -20, 35);
  line(-10, 10, -10, 35);
  line(0, 10, 0, 35);
  line(10, 10, 10, 35);
  pop();
}


function displayGameStatus() {
  fill(0);
  textSize(20);

  textAlign(CENTER);
  text(testStatus, width / 2, 50);
  text(!isDrive ? "Gear: DRIVE" : "Gear: REVERSE", width / 2, 80);
}
//chatgpt for reading data correctly
function gotData() {
  let currentString = serial.readLine();
  trim(currentString);
  if (!currentString) return;

  let values = currentString.split(",");
  if (values.length === 4) {
    latestData = values.map(v => int(v)); // Convert to integers
    isDrive = latestData[3]; // Update isDrive immediately
   
// console.log("Updated Data:", latestData); // Debugging log
  }
}
