#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "luis";
const char* password = "luis1234";

WebServer server(80);

#define LASER_PIN 4
#define SENSOR_PIN 15

bool sensorDisparado = false;
int ultimoEstadoSensor = LOW;

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (sensorDisparado) {
    server.send(200, "application/json", "{\"detectado\": true}");
    sensorDisparado = false; 
  } else {
    server.send(200, "application/json", "{\"detectado\": false}");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, HIGH);
  pinMode(SENSOR_PIN, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("Conectando Sensor ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nSensor conectado!");
  Serial.print("IP DO SENSOR para colocar no App: ");
  Serial.println(WiFi.localIP());

  server.on("/status", HTTP_GET, handleStatus);
  server.begin();
}

void loop() {
  server.handleClient();

  int estadoAtual = digitalRead(SENSOR_PIN);
  
  if (estadoAtual == HIGH && ultimoEstadoSensor == LOW) {
    Serial.println("FEIXE CORTADO! Avisando o App...");
    sensorDisparado = true;
  }
  
  ultimoEstadoSensor = estadoAtual;
}