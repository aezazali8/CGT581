#define STEERING_PIN A0  // Potentiometer for steering
#define ACCEL_PIN A1     // LDR for accelerator
#define BRAKE_PIN A2     // LDR for braking
#define GEAR_BUTTON 2    // Button to toggle Drive/Reverse

bool isDriveMode = true; // Default: Drive mode

void setup() {
  Serial.begin(9600);
  pinMode(GEAR_BUTTON, INPUT_PULLUP);  // Button with internal pull-up resistor
}

void loop() {
  int steering = analogRead(STEERING_PIN);
  int accelRaw = analogRead(ACCEL_PIN);
  int brakeRaw = analogRead(BRAKE_PIN);
  bool buttonState = digitalRead(GEAR_BUTTON);

  // Toggle gear when button is pressed
  static bool lastButtonState = HIGH;
  if (buttonState == LOW && lastButtonState == HIGH) {
    isDriveMode = !isDriveMode;  // Toggle gear mode
  }
  lastButtonState = buttonState;

  // **Invert LDR readings** (Darker = More Speed, Brighter = Less Speed)
  int accel = map(accelRaw, 1023, 0, 0, 1023); // Darker = More Speed
  int brake = map(brakeRaw, 1023, 0, 0, 1023); // Darker = More Braking

  // Send data as "steering,accel,brake,gear"
  Serial.print(steering);
  Serial.print(",");
  Serial.print(accel);
  Serial.print(",");
  Serial.print(brake);
  Serial.print(",");
  Serial.println(isDriveMode); // 1 = Drive, 0 = Reverse

  delay(50);  // Small delay to stabilize readings
}
