CREATE DATABASE IF NOT EXISTS helpdesk_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE helpdesk_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS historico_atendimentos;
DROP TABLE IF EXISTS chamados;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    perfil      VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email),
    CONSTRAINT ck_usuarios_perfil CHECK (perfil IN ('Solicitante', 'Tecnico'))
) ENGINE=InnoDB;

CREATE TABLE categorias (
    id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome  VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE chamados (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    assunto        VARCHAR(150) NOT NULL,
    descricao      TEXT NOT NULL,
    categoria_id   INT UNSIGNED NOT NULL,
    prioridade     VARCHAR(10) NOT NULL,
    solicitante_id INT UNSIGNED NOT NULL,
    tecnico_id     INT UNSIGNED NULL,
    data_abertura  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(20) NOT NULL DEFAULT 'Aberto',
    PRIMARY KEY (id),
    CONSTRAINT ck_chamados_prioridade CHECK (prioridade IN ('Baixa', 'Media', 'Alta')),
    CONSTRAINT ck_chamados_status CHECK (status IN ('Aberto', 'Em atendimento', 'Finalizado')),
    CONSTRAINT fk_chamado_categoria
        FOREIGN KEY (categoria_id)   REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT fk_chamado_solicitante
        FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_chamado_tecnico
        FOREIGN KEY (tecnico_id)     REFERENCES usuarios(id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE historico_atendimentos (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    chamado_id         INT UNSIGNED NOT NULL,
    tecnico_id         INT UNSIGNED NOT NULL,
    data_hora          DATETIME NOT NULL,
    observacao         TEXT NOT NULL,
    status_resultante  VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT ck_historico_status CHECK (status_resultante IN ('Aberto', 'Em atendimento', 'Finalizado')),
    CONSTRAINT fk_historico_chamado
        FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE RESTRICT,
    CONSTRAINT fk_historico_tecnico
        FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
  ('Ana Souza',     'ana@helpdesk.com',     '$2b$10$cJ0n2zuMDQBw5cKQTKbrA.G1sFzLz8HUY1QPWkd0Fj6o1p5EfQViS', 'Solicitante'),
  ('Bruno Lima',    'bruno@helpdesk.com',   '$2b$10$WSeb8j8NY89gnQbmzqTqkefE.SH/L4QiEitNwKzXBd2PLakgiJmRS', 'Solicitante'),
  ('Eduardo Rocha', 'eduardo@helpdesk.com', '$2b$10$F5F0Ck1QUyTqPh7ywd13aO2/gIlkWH2EpxVRFVuMzzcNpJcMVrt1q', 'Solicitante'),
  ('Carlos Mendes', 'carlos@helpdesk.com',  '$2b$10$EXKvh4OekoSU3VB9eb21k.YWJR1stdwlngkQ7RhZn.NU3qduHgnke', 'Tecnico'),
  ('Diana Costa',   'diana@helpdesk.com',   '$2b$10$uWw72KoBjYEb5aN0UQ//l.Px8DizLc5nYnXOpIEwd12dcVs5zj3BG', 'Tecnico');

INSERT INTO categorias (nome) VALUES
  ('Hardware'),
  ('Software'),
  ('Rede');

INSERT INTO chamados
  (assunto, descricao, categoria_id, prioridade, solicitante_id, tecnico_id, data_abertura, status)
VALUES
  ('Computador não liga',
   'O computador da recepção não liga desde ontem, mesmo com o cabo de energia conectado.',
   1, 'Alta', 1, NULL, '2026-11-03 08:15:00', 'Aberto'),

  ('Erro ao abrir o sistema financeiro',
   'Ao abrir o sistema financeiro aparece uma mensagem de erro e a tela fecha.',
   2, 'Media', 1, 4, '2026-11-04 09:30:00', 'Em atendimento'),

  ('Sem acesso à internet na sala 3',
   'Nenhum computador da sala 3 consegue acessar a internet.',
   3, 'Alta', 2, 5, '2026-11-02 14:00:00', 'Finalizado'),

  ('Instalação do pacote Office',
   'Preciso do pacote Office instalado no computador novo do setor de vendas.',
   2, 'Baixa', 2, NULL, '2026-11-05 10:45:00', 'Aberto'),

  ('Monitor com tela piscando',
   'O monitor pisca constantemente e dificulta o trabalho.',
   1, 'Media', 3, 4, '2026-11-06 13:20:00', 'Em atendimento'),

  ('Wi-Fi lento no setor administrativo',
   'A conexão Wi-Fi fica muito lenta no período da tarde.',
   3, 'Baixa', 3, NULL, '2026-11-07 16:00:00', 'Aberto');

INSERT INTO historico_atendimentos
  (chamado_id, tecnico_id, data_hora, observacao, status_resultante)
VALUES
  (2, 4, '2026-11-04 10:00:00',
   'Chamado assumido pelo técnico.',
   'Em atendimento'),

  (3, 5, '2026-11-02 14:30:00',
   'Chamado assumido pelo técnico.',
   'Em atendimento'),

  (3, 5, '2026-11-02 15:10:00',
   'Solução: cabo de rede da sala 3 estava desconectado do switch; reconectado e conexão normalizada.',
   'Finalizado'),

  (5, 4, '2026-11-06 14:00:00',
   'Chamado assumido pelo técnico. Aguardando troca do cabo de vídeo.',
   'Em atendimento');
