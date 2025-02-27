#define STEERING_PIN A0  // Potentiometer for steering
#define ACCEL_PIN A1     // LDR for accelerator
#define BRAKE_PIN A2     // LDR for braking
#define GEAR_BUTTON 2    // Button to toggle Drive/Reverse
#define RED_LED 3
#define YELLOW_LED 4
#define GREEN_LED 5


bool isDriveMode = true;
bool gameStarted = false;
unsigned long startTime = 0;

void setup() {
  Serial.begin(9600);
  pinMode(GEAR_BUTTON, INPUT_PULLUP);  
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
}

void loop() {
  int steering = analogRead(STEERING_PIN);
  int accelRaw = analogRead(ACCEL_PIN);
  int brakeRaw = analogRead(BRAKE_PIN);
  bool buttonState = digitalRead(GEAR_BUTTON);

  static bool lastButtonState = HIGH;
  if (buttonState == LOW && lastButtonState == HIGH) {
    isDriveMode = !isDriveMode;
  }
  lastButtonState = buttonState;

  int accel = map(accelRaw, 1023, 0, 0, 1023); //sine we want darker to mean faster
  int brake = map(brakeRaw, 1023, 0, 0, 1023);

  // Send "steering,accel,brake,gear"
  Serial.print(steering);
  Serial.print(",");
  Serial.print(accel);
  Serial.print(",");
  Serial.print(brake);
  Serial.print(",");
  Serial.println(isDriveMode); // 1 = Drive, 0 = Reverse

  delay(30);  

  if (Serial.available()) {
    char command = Serial.read();

    if (command == 'R') {
      digitalWrite(RED_LED, HIGH);
      digitalWrite(YELLOW_LED, LOW);
      digitalWrite(GREEN_LED, LOW);
    } 
    else if (command == 'Y') {
      digitalWrite(RED_LED, LOW);
      digitalWrite(YELLOW_LED, HIGH);
      digitalWrite(GREEN_LED, LOW);
    } 
    else if (command == 'G') {
      digitalWrite(RED_LED, LOW);
      digitalWrite(YELLOW_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);
      gameStarted = true;
      startTime = millis();
    } 
    else if (command == 'S') { // stop game
      digitalWrite(GREEN_LED, LOW); 
      gameStarted = false;
      unsigned long totalTime = millis() - startTime;
      Serial.println(totalTime); // Sending total time to p5.js
    }
  }
}
