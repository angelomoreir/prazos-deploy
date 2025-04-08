import sqlite3
import os

# Determinar o caminho do banco de dados
if os.environ.get('NETLIFY'):
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

# Criar o banco de dados e as tabelas
with sqlite3.connect(DB_PATH) as conn:
    cursor = conn.cursor()
    
    # Criar tabela de prazos de pagamento
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prazos_pagamento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE,
            descricao TEXT NOT NULL,
            dias INTEGER NOT NULL
        )
    ''')
    
    # Criar tabela de clientes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            codigo TEXT NOT NULL UNIQUE,
            prazo_id INTEGER NOT NULL,
            FOREIGN KEY (prazo_id) REFERENCES prazos_pagamento (id)
        )
    ''')
    
    # Inserir prazos padrão
    prazos_padrao = [
        ('PRONTO', 'A pronto', 0),
        ('30DIAS', 'A 30 dias', 30),
        ('60DIAS', 'A 60 dias', 60),
        ('90DIAS', 'A 90 dias', 90)
    ]
    
    for codigo, descricao, dias in prazos_padrao:
        cursor.execute('''
            INSERT OR IGNORE INTO prazos_pagamento (codigo, descricao, dias)
            VALUES (?, ?, ?)
        ''', (codigo, descricao, dias))
    
    conn.commit()

print("Banco de dados inicializado com sucesso!")