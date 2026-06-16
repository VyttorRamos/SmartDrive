# 🚗 SmartDrive: Gestão Inteligente de Velocidade em Estacionamentos Corporativos

O **SmartDrive** é uma solução integrada de IoT (Internet das Coisas) e Inteligência Artificial desenvolvida para mitigar o excesso de velocidade em pátios e estacionamentos internos de empresas, com foco inicial na demanda da Construtora Vale Verde através da plataforma SAGA SENAI.

Diferente dos radares comerciais tradicionais, o SmartDrive adota uma abordagem **estritamente educativa**. Ao detectar um veículo acima do limite regulamentar (**20 km/h**), o sistema automatiza o registro e exige que o condutor passe por uma etapa de conscientização no aplicativo móvel para regularizar sua situação.

---

## ⚙️ Fluxo de Funcionamento

1. **Detecção Física (Borda):** Microcontroladores associados a sensores dispostos na via monitoram a passagem dos veículos e calculam a velocidade com base no tempo de resposta entre os feixes.
2. **Captura Automatizada:** Caso a velocidade calculada ultrapasse o limite de 20 km/h, o módulo **ESP32-CAM** realiza a captura fotográfica imediata do veículo.
3. **Processamento em Nuvem (IA):** O servidor em Node.js recebe a imagem e consome uma API de Visão Computacional (OCR) para realizar o reconhecimento automatizado dos caracteres da placa.
4. **Abordagem Pedagógica (Mobile):** Os dados são persistidos no banco de dados e o motorista recebe uma notificação *push* em tempo real. Para dar baixa na infração pendente no sistema administrativo, o usuário deve ler obrigatoriamente um termo com diretrizes de segurança da empresa, regido por um cronômetro de leitura compulsória.

---

## 🚀 Principais Funcionalidades

* **Cálculo de Velocidade em Tempo Real:** Lógica embarcada para processamento preciso de latência em milissegundos.
* **Time-Lapse de Monitoramento:** Transmissão de imagens da câmera do Arduino direto no painel do app de forma otimizada para a rede local (500 ms).
* **Leitura de Placas Automatizada:** Integração com algoritmos de inteligência artificial para identificação veicular.
* **Painel de Controle Mobile:** Interface em Dark Mode com acentos em Amarelo/Neon exibindo histórico das últimas leituras, status do veículo (Cadastrado/Não Cadastrado) e pontuação dinâmica do condutor.
* **Gestão de Segurança:** Tratamento contra SQL Injection no banco de dados através de *Prepared Statements*.

---

## 🧰 Stack Tecnológica

### Hardware & IoT

* **Microcontroladores:** ESP32-CAM / Família ESP32
* **Sensores:** Sensores de proximidade/laser (Prova de conceito)
* **Linguagem:** C++ (Arduino IDE)

### Back-end & Inteligência Artificial

* **Ambiente de Execução:** Node.js
* **Banco de Dados:** MySQL (Relacional)
* **Visão Computacional:** API Plate Recognizer (LPR/OCR)

### Front-end Mobile

* **Framework:** React Native (Expo)
* **Linguagem:** TypeScript

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

* Node.js
* MySQL
* Arduino IDE (com suporte às placas ESP32 instalado)
* Expo CLI
* Uma conta ativa no Plate Recognizer para obtenção da chave da API OCR

---

### 1. Configurando o Banco de Dados (MySQL)

1. Inicie o serviço do MySQL.
2. Crie um banco de dados chamado `smartdrive_db` (ou o nome definido no projeto).
3. Importe o script SQL fornecido para criar as tabelas:

   * `usuarios`
   * `veiculos`
   * `registros`
   * `infracoes`

---

### 2. Rodando o Back-end (Node.js)

Abra o terminal na pasta do servidor e execute:

```bash
npm install
```

Configure as variáveis de ambiente do projeto, incluindo:

* Credenciais do MySQL
* Chave da API Plate Recognizer

Inicie o servidor:

```bash
node index.js
```

---

### 3. Configurando o Hardware (ESP32 / Sensores)

1. Abra os arquivos `.ino` na Arduino IDE.
2. Configure as credenciais da sua rede Wi-Fi:

```cpp
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
```

3. Faça o upload do código para os dispositivos ESP32.
4. Abra o Monitor Serial.
5. Anote os endereços IP gerados para:

   * ESP32-CAM
   * ESP32 dos sensores

Esses IPs serão utilizados posteriormente pelo aplicativo móvel.

---

### 4. Rodando o Aplicativo Mobile (React Native)

Abra o terminal na pasta do aplicativo e execute:

```bash
npm install
```

Inicie o Expo:

```bash
npx expo start
```

Abra o aplicativo **Expo Go** no celular e escaneie o QR Code exibido no terminal.

#### Ajuste de IPs

Após abrir o aplicativo:

1. Acesse a aba **Configurações e IPs**.
2. Insira os endereços IP da câmera e dos sensores obtidos no passo anterior.
3. Salve as configurações.

Isso permitirá que o aplicativo se comunique corretamente com os dispositivos ESP32 na rede local.

---

## 👨‍💻 Equipe e Orientação

### Desenvolvedores

* **Luis Otávio de Deus dos Santos**
* **Yasmin Siqueira Lobo**
* **Vyttor Gabriel Ramos Camillo**

### Professores Orientadores

* **Anderson Adelson de Matos**
* **Marcello Benevides**

### Instituição

**Faculdade SENAI Félix Guisard — Taubaté/SP**
