import sqlite3
import os

# Caminho para o banco de dados
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database_new.db')

# Conectar ao banco de dados (será criado se não existir)
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Criar tabela de prazos de pagamento
cursor.execute('''
CREATE TABLE prazos_pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    dias INTEGER NOT NULL
)
''')

# Criar tabela de clientes com referência à tabela de prazos
cursor.execute('''
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    prazo_id INTEGER NOT NULL,
    FOREIGN KEY (prazo_id) REFERENCES prazos_pagamento (id)
)
''')

# Inserir dados de exemplo para prazos de pagamento
prazos_exemplo = [
    ('PRONTO', 'A pronto', 0),
    ('30DIAS', 'A 30 dias', 30),
    ('60DIAS', 'A 60 dias', 60),
    ('90DIAS', 'A 90 dias', 90)
]

cursor.executemany('INSERT INTO prazos_pagamento (codigo, descricao, dias) VALUES (?, ?, ?)', prazos_exemplo)

# Obter IDs dos prazos inseridos
prazos_ids = {}
for prazo in prazos_exemplo:
    cursor.execute('SELECT id FROM prazos_pagamento WHERE codigo = ?', (prazo[0],))
    prazos_ids[prazo[1]] = cursor.fetchone()[0]

# Inserir dados de exemplo para clientes
clientes_exemplo = [
    ('João da Silva', 'CLI001', prazos_ids['A 30 dias']),
    ('Maria Oliveira', 'CLI002', prazos_ids['A pronto']),
    ('Carlos Santos', 'CLI003', prazos_ids['A 60 dias']),
    ('Ana Pereira', 'CLI004', prazos_ids['A 30 dias']),
    ('Pedro Almeida', 'CLI005', prazos_ids['A pronto']),
    ('Luísa Ferreira', 'CLI006', prazos_ids['A 90 dias']),
    ('Roberto Gomes', 'CLI007', prazos_ids['A 60 dias']),
    ('Cristina Lima', 'CLI008', prazos_ids['A pronto']),
    ('Fernando Costa', 'CLI009', prazos_ids['A 30 dias']),
    ('Mariana Sousa', 'CLI010', prazos_ids['A 60 dias'])
]

cursor.executemany('INSERT INTO clientes (nome, codigo, prazo_id) VALUES (?, ?, ?)', clientes_exemplo)

# Salvar alterações e fechar conexão
conn.commit()
conn.close()

print("Banco de dados inicializado com sucesso!")
print(f"Foram inseridos {len(prazos_exemplo)} prazos de pagamento e {len(clientes_exemplo)} clientes de exemplo.")
print(f"Novo banco de dados criado em: {DB_PATH}")