from flask import Flask, render_template, request, jsonify, g, redirect, url_for
import sqlite3
import os
import sys
import psycopg2
import psycopg2.extras

# Configuração da aplicação
app = Flask(__name__)

# Determinar o caminho do banco de dados
if os.environ.get('NETLIFY'):  # Verifica se estamos em ambiente de produção
    # Caminho fixo para o banco de dados em produção
    app.config['DATABASE'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
else:
    # Ambiente local
    if getattr(sys, 'frozen', False):
        # Executável PyInstaller
        base_path = os.path.dirname(sys.executable)
        app.config['DATABASE'] = os.path.join(base_path, 'database.db')
    else:
        # Modo de desenvolvimento
        app.config['DATABASE'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

# Funções para conexão com o banco de dados
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

app.teardown_appcontext(close_db)

app.config['SECRET_KEY'] = 'chave-secreta-da-aplicacao'

# Inicializar o banco de dados
with app.app_context():
    db = get_db()
    cursor = db.cursor()
    
    # Criar tabela de prazos de pagamento se não existir
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prazos_pagamento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE,
            descricao TEXT NOT NULL,
            dias INTEGER NOT NULL
        )
    ''')
    
    # Criar tabela de clientes se não existir
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            codigo TEXT NOT NULL UNIQUE,
            prazo_id INTEGER NOT NULL,
            FOREIGN KEY (prazo_id) REFERENCES prazos_pagamento (id)
        )
    ''')
    
    # Inserir prazos padrão se não existirem
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
    
    db.commit()

# Rotas da aplicação
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/admin/prazos')
def admin_prazos():
    return render_template('admin_prazos.html')

@app.route('/procurar_clientes', methods=['GET'])
def procurar_clientes():
    termo = request.args.get('termo', '')
    
    db = get_db()
    cursor = db.cursor()
    
    # Busca clientes que correspondem ao termo de busca
    cursor.execute(
        """SELECT c.id, c.nome, c.codigo, p.descricao as prazo_pagamento, c.prazo_id 
           FROM clientes c 
           JOIN prazos_pagamento p ON c.prazo_id = p.id 
           WHERE c.nome LIKE ? OR c.codigo LIKE ? 
           ORDER BY c.nome""", 
        (f'%{termo}%', f'%{termo}%')
    )
    clientes = [dict(row) for row in cursor.fetchall()]
    
    return jsonify(clientes)

@app.route('/cliente/<int:cliente_id>', methods=['GET'])
def obter_cliente(cliente_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute(
        """SELECT c.id, c.nome, c.codigo, p.descricao as prazo_pagamento, c.prazo_id 
           FROM clientes c 
           JOIN prazos_pagamento p ON c.prazo_id = p.id 
           WHERE c.id = ?""", 
        (cliente_id,)
    )
    cliente = cursor.fetchone()
    
    if cliente:
        return jsonify(dict(cliente))
    else:
        return jsonify({"erro": "Cliente não encontrado"}), 404

@app.route('/filtrar_por_prazo', methods=['GET'])
def filtrar_por_prazo():
    prazo = request.args.get('prazo', '')
    
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute(
        """SELECT c.id, c.nome, c.codigo, p.descricao as prazo_pagamento, c.prazo_id 
           FROM clientes c 
           JOIN prazos_pagamento p ON c.prazo_id = p.id 
           WHERE p.descricao = ?""", 
        (prazo,)
    )
    clientes = [dict(row) for row in cursor.fetchall()]
    
    return jsonify(clientes)

# Rotas CRUD para clientes
@app.route('/api/clientes', methods=['GET'])
def listar_clientes():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute(
        """SELECT c.id, c.nome, c.codigo, p.descricao as prazo_pagamento, c.prazo_id 
           FROM clientes c 
           JOIN prazos_pagamento p ON c.prazo_id = p.id 
           ORDER BY c.nome"""
    )
    clientes = [dict(row) for row in cursor.fetchall()]
    
    return jsonify(clientes)

@app.route('/api/clientes', methods=['POST'])
def criar_cliente():
    dados = request.json
    
    if not dados or 'nome' not in dados or 'codigo' not in dados or 'prazo_id' not in dados:
        return jsonify({"erro": "Dados incompletos"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO clientes (nome, codigo, prazo_id) VALUES (?, ?, ?)",
            (dados['nome'], dados['codigo'], dados['prazo_id'])
        )
        db.commit()
        
        # Retornar o cliente recém-criado
        cliente_id = cursor.lastrowid
        cursor.execute(
            """SELECT c.id, c.nome, c.codigo, p.descricao as prazo_pagamento, c.prazo_id 
               FROM clientes c 
               JOIN prazos_pagamento p ON c.prazo_id = p.id 
               WHERE c.id = ?""", 
            (cliente_id,)
        )
        novo_cliente = dict(cursor.fetchone())
        
        return jsonify(novo_cliente), 201
    except sqlite3.IntegrityError:
        return jsonify({"erro": "Código de cliente já existe"}), 409
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/clientes/<int:cliente_id>', methods=['PUT'])
def atualizar_cliente(cliente_id):
    dados = request.json
    
    if not dados or 'nome' not in dados or 'codigo' not in dados or 'prazo_id' not in dados:
        return jsonify({"erro": "Dados incompletos"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Verificar se o cliente existe
    cursor.execute("SELECT * FROM clientes WHERE id = ?", (cliente_id,))
    cliente = cursor.fetchone()
    
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    try:
        cursor.execute(
            "UPDATE clientes SET nome = ?, codigo = ?, prazo_id = ? WHERE id = ?",
            (dados['nome'], dados['codigo'], dados['prazo_id'], cliente_id)
        )
        db.commit()
        
        # Retornar o cliente atualizado
        cursor.execute(
            """SELECT c.id, c.nome, c.codigo, p.descricao as prazo_pagamento, c.prazo_id 
               FROM clientes c 
               JOIN prazos_pagamento p ON c.prazo_id = p.id 
               WHERE c.id = ?""", 
            (cliente_id,)
        )
        cliente_atualizado = dict(cursor.fetchone())
        
        return jsonify(cliente_atualizado)
    except sqlite3.IntegrityError:
        return jsonify({"erro": "Código de cliente já existe"}), 409
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/clientes/<int:cliente_id>', methods=['DELETE'])
def excluir_cliente(cliente_id):
    db = get_db()
    cursor = db.cursor()
    
    # Verificar se o cliente existe
    cursor.execute("SELECT * FROM clientes WHERE id = ?", (cliente_id,))
    cliente = cursor.fetchone()
    
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    try:
        cursor.execute("DELETE FROM clientes WHERE id = ?", (cliente_id,))
        db.commit()
        
        return jsonify({"mensagem": "Cliente excluído com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# Rotas CRUD para prazos de pagamento
@app.route('/api/prazos', methods=['GET'])
def listar_prazos():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("SELECT * FROM prazos_pagamento ORDER BY dias")
    prazos = [dict(row) for row in cursor.fetchall()]
    
    return jsonify(prazos)

@app.route('/api/prazos', methods=['POST'])
def criar_prazo():
    dados = request.json
    
    if not dados or 'codigo' not in dados or 'descricao' not in dados or 'dias' not in dados:
        return jsonify({"erro": "Dados incompletos"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO prazos_pagamento (codigo, descricao, dias) VALUES (?, ?, ?)",
            (dados['codigo'], dados['descricao'], dados['dias'])
        )
        db.commit()
        
        # Retornar o prazo recém-criado
        prazo_id = cursor.lastrowid
        cursor.execute("SELECT * FROM prazos_pagamento WHERE id = ?", (prazo_id,))
        novo_prazo = dict(cursor.fetchone())
        
        return jsonify(novo_prazo), 201
    except sqlite3.IntegrityError:
        return jsonify({"erro": "Código de prazo já existe"}), 409
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/prazos/<int:prazo_id>', methods=['GET'])
def obter_prazo(prazo_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("SELECT * FROM prazos_pagamento WHERE id = ?", (prazo_id,))
    prazo = cursor.fetchone()
    
    if prazo:
        return jsonify(dict(prazo))
    else:
        return jsonify({"erro": "Prazo não encontrado"}), 404

@app.route('/api/prazos/<int:prazo_id>', methods=['PUT'])
def atualizar_prazo(prazo_id):
    dados = request.json
    
    if not dados or 'codigo' not in dados or 'descricao' not in dados or 'dias' not in dados:
        return jsonify({"erro": "Dados incompletos"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Verificar se o prazo existe
    cursor.execute("SELECT * FROM prazos_pagamento WHERE id = ?", (prazo_id,))
    prazo = cursor.fetchone()
    
    if not prazo:
        return jsonify({"erro": "Prazo não encontrado"}), 404
    
    try:
        cursor.execute(
            "UPDATE prazos_pagamento SET codigo = ?, descricao = ?, dias = ? WHERE id = ?",
            (dados['codigo'], dados['descricao'], dados['dias'], prazo_id)
        )
        db.commit()
        
        # Retornar o prazo atualizado
        cursor.execute("SELECT * FROM prazos_pagamento WHERE id = ?", (prazo_id,))
        prazo_atualizado = dict(cursor.fetchone())
        
        return jsonify(prazo_atualizado)
    except sqlite3.IntegrityError:
        return jsonify({"erro": "Código de prazo já existe"}), 409
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/prazos/<int:prazo_id>', methods=['DELETE'])
def excluir_prazo(prazo_id):
    db = get_db()
    cursor = db.cursor()
    
    # Verificar se o prazo existe
    cursor.execute("SELECT * FROM prazos_pagamento WHERE id = ?", (prazo_id,))
    prazo = cursor.fetchone()
    
    if not prazo:
        return jsonify({"erro": "Prazo não encontrado"}), 404
    
    # Verificar se o prazo está sendo usado por algum cliente
    cursor.execute("SELECT COUNT(*) as total FROM clientes WHERE prazo_id = ?", (prazo_id,))
    resultado = cursor.fetchone()
    
    if resultado['total'] > 0:
        return jsonify({"erro": "Este prazo está sendo usado por clientes e não pode ser excluído"}), 400
    
    try:
        cursor.execute("DELETE FROM prazos_pagamento WHERE id = ?", (prazo_id,))
        db.commit()
        
        return jsonify({"mensagem": "Prazo excluído com sucesso"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# Execução da aplicação
if __name__ == '__main__':
    app.run(debug=True)
else:
    application = app