-- CRIAR BANCO
CREATE DATABASE smartdrive;
USE smartdrive;

-- USUÁRIOS 
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'usuario') NOT NULL,
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VEÍCULOS
CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(100),
    cor VARCHAR(50),
    usuario_id INT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- SENSORES
CREATE TABLE sensores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50),
    localizacao VARCHAR(100),
    ip VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REGISTROS 
CREATE TABLE registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT,
    velocidade INT NOT NULL,
    placa_detectada VARCHAR(10),
    imagem_url TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensores(id)
);

-- INFRAÇÕES
CREATE TABLE infracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registro_id INT,
    usuario_id INT,
    veiculo_id INT,
    velocidade INT NOT NULL,
    limite INT DEFAULT 20,
    status ENUM('pendente', 'visualizado') DEFAULT 'pendente',
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (registro_id) REFERENCES registros(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);
