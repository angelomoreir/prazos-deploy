document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const formCliente = document.getElementById('form-cliente');
    const formTitulo = document.getElementById('form-titulo');
    const clienteIdInput = document.getElementById('cliente-id');
    const clienteNomeInput = document.getElementById('cliente-nome-input');
    const clienteCodigoInput = document.getElementById('cliente-codigo-input');
    const clientePrazoInput = document.getElementById('cliente-prazo-input');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    // Carregar os prazos de pagamento disponíveis
    carregarPrazos();
    
    // Elementos da tabela
    const tabelaClientesAdmin = document.getElementById('tabela-clientes-admin');
    const semClientesDiv = document.getElementById('sem-clientes');
    
    // Elementos do modal de exclusão
    const modalConfirmarExclusao = new bootstrap.Modal(document.getElementById('modal-confirmar-exclusao'));
    const nomeClienteExclusao = document.getElementById('nome-cliente-exclusao');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    
    // Elementos de notificação
    const toastSucesso = new bootstrap.Toast(document.getElementById('toast-sucesso'));
    const toastErro = new bootstrap.Toast(document.getElementById('toast-erro'));
    const toastSucessoMensagem = document.getElementById('toast-sucesso-mensagem');
    const toastErroMensagem = document.getElementById('toast-erro-mensagem');
    
    // Variáveis de controle
    let clienteEmEdicao = null;
    let clienteParaExcluir = null;
    
    // Carregar lista de clientes ao iniciar
    carregarClientes();
    
    // Função para carregar a lista de clientes
    function carregarClientes() {
        fetch('/api/clientes')
            .then(response => response.json())
            .then(data => {
                exibirClientes(data);
            })
            .catch(error => {
                console.error('Erro ao carregar clientes:', error);
                mostrarErro('Não foi possível carregar a lista de clientes.');
            });
    }
    
    // Função para carregar os prazos de pagamento
    function carregarPrazos() {
        fetch('/api/prazos')
            .then(response => response.json())
            .then(data => {
                preencherSelectPrazos(data);
            })
            .catch(error => {
                console.error('Erro ao carregar prazos:', error);
                mostrarErro('Não foi possível carregar a lista de prazos de pagamento.');
            });
    }
    
    // Função para preencher o select de prazos
    function preencherSelectPrazos(prazos) {
        const select = document.getElementById('cliente-prazo-input');
        
        // Limpar opções existentes, mantendo apenas a primeira
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar os prazos como opções
        prazos.forEach(prazo => {
            const option = document.createElement('option');
            option.value = prazo.id;
            option.textContent = prazo.descricao;
            select.appendChild(option);
        });
    }
    
    // Função para exibir os clientes na tabela
    function exibirClientes(clientes) {
        tabelaClientesAdmin.innerHTML = '';
        
        if (clientes.length === 0) {
            semClientesDiv.classList.remove('d-none');
            return;
        }
        
        semClientesDiv.classList.add('d-none');
        
        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            
            // Aplicar classe de destaque ao prazo
            let prazoClass = '';
            if (cliente.prazo_pagamento === 'A pronto') {
                prazoClass = 'prazo-pronto';
            } else if (cliente.prazo_pagamento === 'A 30 dias') {
                prazoClass = 'prazo-30';
            } else if (cliente.prazo_pagamento === 'A 60 dias') {
                prazoClass = 'prazo-60';
            } else if (cliente.prazo_pagamento === 'A 90 dias') {
                prazoClass = 'prazo-90';
            }
            
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.codigo}</td>
                <td><span class="prazo-destaque ${prazoClass}">${cliente.prazo_pagamento}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${cliente.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${cliente.id}" data-nome="${cliente.nome}">
                        <i class="bi bi-trash"></i> Excluir
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = tr.querySelector('.btn-editar');
            const btnExcluir = tr.querySelector('.btn-excluir');
            
            btnEditar.addEventListener('click', function() {
                prepararEdicao(cliente);
            });
            
            btnExcluir.addEventListener('click', function() {
                prepararExclusao(cliente);
            });
            
            tabelaClientesAdmin.appendChild(tr);
        });
    }
    
    // Função para preparar o formulário para edição
    function prepararEdicao(cliente) {
        clienteEmEdicao = cliente;
        
        clienteIdInput.value = cliente.id;
        clienteNomeInput.value = cliente.nome;
        clienteCodigoInput.value = cliente.codigo;
        clientePrazoInput.value = cliente.prazo_id;
        
        formTitulo.textContent = 'Editar Cliente';
        btnCancelar.classList.remove('d-none');
        btnSalvar.textContent = 'Atualizar Cliente';
        
        // Rolar para o formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Função para preparar a exclusão
    function prepararExclusao(cliente) {
        clienteParaExcluir = cliente;
        nomeClienteExclusao.textContent = cliente.nome;
        modalConfirmarExclusao.show();
    }
    
    // Função para resetar o formulário
    function resetarFormulario() {
        clienteEmEdicao = null;
        clienteIdInput.value = '';
        formCliente.reset();
        formTitulo.textContent = 'Adicionar Novo Cliente';
        btnCancelar.classList.add('d-none');
        btnSalvar.textContent = 'Salvar Cliente';
    }
    
    // Função para mostrar mensagem de sucesso
    function mostrarSucesso(mensagem) {
        toastSucessoMensagem.textContent = mensagem;
        toastSucesso.show();
    }
    
    // Função para mostrar mensagem de erro
    function mostrarErro(mensagem) {
        toastErroMensagem.textContent = mensagem;
        toastErro.show();
    }
    
    // Event listener para o formulário
    formCliente.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const cliente = {
            nome: clienteNomeInput.value.trim(),
            codigo: clienteCodigoInput.value.trim(),
            prazo_id: parseInt(clientePrazoInput.value)
        };
        
        if (clienteEmEdicao) {
            // Atualizar cliente existente
            fetch(`/api/clientes/${clienteEmEdicao.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cliente)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => Promise.reject(data.erro || 'Erro ao atualizar cliente'));
                }
                return response.json();
            })
            .then(data => {
                mostrarSucesso('Cliente atualizado com sucesso!');
                resetarFormulario();
                carregarClientes();
            })
            .catch(error => {
                console.error('Erro ao atualizar cliente:', error);
                mostrarErro(typeof error === 'string' ? error : 'Erro ao atualizar cliente.');
            });
        } else {
            // Criar novo cliente
            fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cliente)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => Promise.reject(data.erro || 'Erro ao criar cliente'));
                }
                return response.json();
            })
            .then(data => {
                mostrarSucesso('Cliente adicionado com sucesso!');
                resetarFormulario();
                carregarClientes();
            })
            .catch(error => {
                console.error('Erro ao criar cliente:', error);
                mostrarErro(typeof error === 'string' ? error : 'Erro ao criar cliente.');
            });
        }
    });
    
    // Event listener para o botão cancelar
    btnCancelar.addEventListener('click', function() {
        resetarFormulario();
    });
    
    // Event listener para o botão confirmar exclusão
    btnConfirmarExclusao.addEventListener('click', function() {
        if (!clienteParaExcluir) return;
        
        fetch(`/api/clientes/${clienteParaExcluir.id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data.erro || 'Erro ao excluir cliente'));
            }
            return response.json();
        })
        .then(data => {
            mostrarSucesso('Cliente excluído com sucesso!');
            modalConfirmarExclusao.hide();
            carregarClientes();
            
            // Se o cliente excluído estava em edição, resetar o formulário
            if (clienteEmEdicao && clienteEmEdicao.id === clienteParaExcluir.id) {
                resetarFormulario();
            }
        })
        .catch(error => {
            console.error('Erro ao excluir cliente:', error);
            mostrarErro(typeof error === 'string' ? error : 'Erro ao excluir cliente.');
            modalConfirmarExclusao.hide();
        });
    });
});