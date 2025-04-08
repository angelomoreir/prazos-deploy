document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const buscaInput = document.getElementById('busca');
    const sugestoesDiv = document.getElementById('sugestoes');
    const btnBuscar = document.getElementById('btn-buscar'); 
    const resultadoDiv = document.getElementById('resultado');
    const clienteNome = document.getElementById('cliente-nome');
    const clienteCodigo = document.getElementById('cliente-codigo');
    const clientePrazo = document.getElementById('cliente-prazo');
    
    // Variáveis para controle
    let timeoutId;
    let clientesSugeridos = [];
    let clienteSelecionado = null;
    
    // Função para procurar sugestões de clientes
    function procurarSugestoes(termo) {
        if (termo.length < 2) {
            sugestoesDiv.innerHTML = '';
            sugestoesDiv.classList.add('d-none');
            return;
        }
        
        // Mostrar indicador de carregamento
        sugestoesDiv.innerHTML = '<div class="text-center p-2"><span class="spinner-border spinner-border-sm" role="status"></span> Buscando...</div>';
        sugestoesDiv.classList.remove('d-none');
        
        fetch(`/procurar_clientes?termo=${encodeURIComponent(termo)}`)
            .then(response => response.json())
            .then(data => {
                clientesSugeridos = data;
                exibirSugestoes(data);
                console.log('Clientes encontrados:', data); // Log para debug
            })
            .catch(error => {
                console.error('Erro ao procurar sugestões:', error);
                sugestoesDiv.innerHTML = '<div class="text-center p-2 text-danger">Erro ao buscar clientes</div>';
            });
    }
    
    // Função para exibir sugestões
    function exibirSugestoes(clientes) {
        sugestoesDiv.innerHTML = '';
        
        if (clientes.length === 0) {
            sugestoesDiv.innerHTML = '<div class="text-center p-3">Nenhum cliente encontrado</div>';
            sugestoesDiv.classList.remove('d-none');
            return;
        }
        
        // Adicionar mensagem de ajuda quando houver muitos resultados
        if (clientes.length > 10) {
            const ajudaDiv = document.createElement('div');
            ajudaDiv.classList.add('text-info', 'small', 'p-2', 'text-center', 'border-bottom');
            ajudaDiv.innerHTML = `<i class="bi bi-info-circle"></i> Mostrando ${clientes.length} resultados. Use as setas ↑↓ para navegar e Enter para selecionar.`;
            sugestoesDiv.appendChild(ajudaDiv);
        }
        
        // Criar um container para os itens de sugestão
        const listaItens = document.createElement('div');
        listaItens.classList.add('sugestoes-lista');
        sugestoesDiv.appendChild(listaItens);
        
        // Exibir todos os clientes encontrados com formato melhorado
        clientes.forEach((cliente, index) => {
            const item = document.createElement('a');
            item.classList.add('list-group-item', 'list-group-item-action', 'sugestao-item');
            item.innerHTML = `
                <strong>${cliente.nome}</strong>
                <small>Código: ${cliente.codigo} | Prazo: ${cliente.prazo_pagamento}</small>
            `;
            // Adicionar classe para melhor visualização quando houver muitos resultados
            if (clientes.length > 10) {
                item.classList.add('py-2');
            }
            item.dataset.index = index;
            item.id = `sugestao-${index}`;
            
            item.addEventListener('click', function() {
                selecionarCliente(cliente);
            });
            
            listaItens.appendChild(item);
        });
        
        // Adicionar mensagem indicando o número de resultados encontrados
        if (clientes.length > 0) {
            const resultadoInfo = document.createElement('div');
            resultadoInfo.classList.add('text-muted', 'small', 'p-2', 'text-center', 'border-top');
            resultadoInfo.textContent = `${clientes.length} cliente(s) encontrado(s)`;
            sugestoesDiv.appendChild(resultadoInfo);
        }
        
        sugestoesDiv.classList.remove('d-none');
    }
    
    // Função para selecionar um cliente
    function selecionarCliente(cliente) {
        clienteSelecionado = cliente;
        buscaInput.value = cliente.nome;
        sugestoesDiv.classList.add('d-none');
        exibirDetalhesCliente(cliente);
    }
    
    // Função para exibir detalhes do cliente
    function exibirDetalhesCliente(cliente) {
        clienteNome.textContent = cliente.nome;
        clienteCodigo.textContent = cliente.codigo;
        
        // Aplicar formatação ao prazo de pagamento
        clientePrazo.textContent = cliente.prazo_pagamento;
        clientePrazo.className = ''; // Limpar classes anteriores
        
        if (cliente.prazo_pagamento === 'A pronto') {
            clientePrazo.classList.add('prazo-destaque', 'prazo-pronto');
        } else if (cliente.prazo_pagamento === 'A 30 dias') {
            clientePrazo.classList.add('prazo-destaque', 'prazo-30');
        } else if (cliente.prazo_pagamento === 'A 60 dias') {
            clientePrazo.classList.add('prazo-destaque', 'prazo-60');
        } else if (cliente.prazo_pagamento === 'A 90 dias') {
            clientePrazo.classList.add('prazo-destaque', 'prazo-90');
        }
        
        resultadoDiv.classList.remove('d-none');
    }
    
    // Variável para controlar a navegação por teclado
    let itemSelecionadoIndex = -1;
    
    // Função para destacar um item de sugestão
    function destacarItem(index) {
        // Remover destaque anterior
        const itemAnterior = document.querySelector('.sugestao-item.active');
        if (itemAnterior) {
            itemAnterior.classList.remove('active');
        }
        
        // Adicionar destaque ao novo item
        if (index >= 0 && index < clientesSugeridos.length) {
            const novoItem = document.getElementById(`sugestao-${index}`);
            if (novoItem) {
                novoItem.classList.add('active');
                // Garantir que o item esteja visível na área de rolagem
                novoItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }
    
    // Event listeners
    buscaInput.addEventListener('input', function() {
        clearTimeout(timeoutId);
        const termo = this.value.trim();
        
        timeoutId = setTimeout(() => {
            procurarSugestoes(termo);
        }, 300);
    });
    
    buscaInput.addEventListener('keydown', function(e) {
        const termo = this.value.trim();
        
        if (termo.length < 2) return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                itemSelecionadoIndex = (itemSelecionadoIndex + 1) % clientesSugeridos.length;
                destacarItem(itemSelecionadoIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                itemSelecionadoIndex = (itemSelecionadoIndex - 1 + clientesSugeridos.length) % clientesSugeridos.length;
                destacarItem(itemSelecionadoIndex);
                break;
                
            case 'Enter':
                if (itemSelecionadoIndex >= 0) {
                    selecionarCliente(clientesSugeridos[itemSelecionadoIndex]);
                }
                break;
        }
    });
    
    btnBuscar.addEventListener('click', function() {
        const termo = buscaInput.value.trim();
        if (termo.length >= 2) {
            procurarSugestoes(termo);
        }
    });
});