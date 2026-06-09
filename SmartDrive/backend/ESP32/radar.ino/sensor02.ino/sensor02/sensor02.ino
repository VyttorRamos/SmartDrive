#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "yasmin";
const char* password = "lobo270906";

WebServer server(80);

#define LASER_PIN 4
#define SENSOR_PIN 15

bool carroSaindo = false;
int ultimoEstadoSensor = LOW;

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (carroSaindo) {
    server.send(200, "application/json", "{\"saida\": true}");
    carroSaindo = false;
  } else {
    server.send(200, "application/json", "{\"saida\": false}");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, HIGH);
  pinMode(SENSOR_PIN, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado!");
  Serial.print("IP SAIDA: ");
  Serial.println(WiFi.localIP());

  server.on("/status", HTTP_GET, handleStatus);
  server.begin();
}

void loop() {
  server.handleClient(); 

  int estadoAtual = digitalRead(SENSOR_PIN);

  if (estadoAtual == HIGH && ultimoEstadoSensor == LOW) {
    Serial.println("🚙 CARRO SAINDO");
    carroSaindo = true;
  }

  ultimoEstadoSensor = estadoAtual;
}