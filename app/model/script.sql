CREATE DATABASE db_aventura_pet;

USE db_aventura_pet;

CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome_usuario VARCHAR(100), 
    tipo_usuario BOOLEAN,
    pet_visualizado LONGTEXT
);

CREATE TABLE contato_usuario(
    id_contato_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    telefone VARCHAR(20),
    cep VARCHAR(9),
    email VARCHAR(100),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE password_hash(
    id_password_hash INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    password_hash VARCHAR(300),
    ativo BOOLEAN,
    data_criacao DATE,
    data_inativacao DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- tabela para armazenar os pets vizualizado pelo usuario
CREATE TABLE view_pet_user(
    id_view_pet_user INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    id_user_pet INT,
    pet_like BOOLEAN
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_user_pet) REFERENCES pet_user(id_user_pet)
)

CREATE TABLE pet_user(
    id_user_pet INT PRIMARY key AUTO_INCREMENT,
    id_usuario INT,   
    nome_pet VARCHAR(50),
    disponivel BOOLEAN,
    idade INT,
    caracteristica TEXT(500),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE image_pet(
    id_imagem_pet INT PRIMARY KEY AUTO_INCREMENT,
    id_user_pet INT,
    imagem LONGBLOB,
    FOREIGN KEY (id_user_pet) REFERENCES pet_user(id_user_pet)
);

CREATE TABLE configuracao_usuario(
    id_configuracao_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    distancia INT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);



-- TRAS TODOS OS PETS NAO VIZUALIZADO PELO USUARIO
CREATE VIEW not_view_user_pet AS
SELECT 
	pet_user.id_usuario, pet_user.nome_pet, pet_user.idade, pet_user.caracteristica, pet_user.disponivel, pet_user.id_user_pet,
    usuario.nome_usuario, 
    contato_usuario.telefone, contato_usuario.cep,
    image_pet.imagem,
    view_pet_user.id_user_pet AS view_pet_id_user, view_pet_user.id_user_pet AS view_pet_id_pet, view_pet_user.id_user_pet AS view_pet_user_id
FROM pet_user
INNER JOIN usuario ON pet_user.id_usuario = usuario.id_usuario 
INNER JOIN contato_usuario ON  pet_user.id_usuario = contato_usuario.id_usuario
INNER JOIN image_pet ON pet_user.id_user_pet = image_pet.id_user_pet
left JOIN view_pet_user ON pet_user.id_user_pet = view_pet_user.id_user_pet --  AND pet_user.id_user_pet = view_pet_user.id_user_pet

WHERE pet_user.disponivel = 1 
AND view_pet_user.id_usuario IS NULL; 
-- AND view_pet_user.id_user_pet IS NULL
