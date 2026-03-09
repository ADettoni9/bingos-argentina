CREATE DATABASE IF NOT EXISTS bingos_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bingos_db;

CREATE TABLE IF NOT EXISTS Clientes (
    ID_Cliente INT          AUTO_INCREMENT PRIMARY KEY,
    Nombre     VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Sorteos (
    ID_Sorteo    INT            AUTO_INCREMENT PRIMARY KEY,
    Nombre_Bingo VARCHAR(100)   NOT NULL,
    Precio       DECIMAL(10, 2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Ventas (
    ID_Venta   INT          AUTO_INCREMENT PRIMARY KEY,
    ID_Cliente INT          NOT NULL,
    ID_Sorteo  INT          NOT NULL,
    Estado     VARCHAR(20)  NOT NULL DEFAULT 'Pendiente',

    FOREIGN KEY (ID_Cliente) REFERENCES Clientes(ID_Cliente),
    FOREIGN KEY (ID_Sorteo)  REFERENCES Sorteos(ID_Sorteo)
) ENGINE=InnoDB;

INSERT INTO Sorteos (Nombre_Bingo, Precio)
VALUES ('Super Bingo del Pescador', 165000);
