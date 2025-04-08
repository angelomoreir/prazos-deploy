# Sistema de Consulta de Prazos de Pagamento

Este é um aplicativo web simples para consulta de condições de pagamento de clientes. O sistema permite que funcionários procurem rapidamente informações sobre os prazos de pagamento dos clientes.

## Funcionalidades

- **Procura de Cliente**:
  - Campo de procura por nome, NIF, número de cliente
  - Sugestão automática ao digitar (auto-complete)

- **Detalhes do Cliente**:
  - Nome
  - Código do cliente
  - Prazo de pagamento (ex: A pronto, A 30 dias, A 60 dias)

- **Extras**:
  - Filtro por condição de pagamento: Listar todos que são "A pronto", por exemplo

## Tecnologias Utilizadas

- Backend: Python (Flask)
- Frontend: HTML, JavaScript, CSS, Bootstrap
- Banco de dados: SQLite

## Como Executar

1. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```

2. Inicialize o banco de dados:
   ```
   python init_db.py
   ```

3. Execute a aplicação:
   ```
   python app.py
   ```

4. Acesse a aplicação em seu navegador: http://localhost:5000