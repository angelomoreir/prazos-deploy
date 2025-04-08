document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const formPrazo = document.getElementById('form-prazo');
    const formTitulo = document.getElementById('form-titulo');
    const prazoIdInput = document.getElementById('prazo-id');
    const prazoCodigoInput = document.getElementById('prazo-codigo-input');
    const prazoDescricaoInput = document.getElementById('prazo-descricao-input');
    const prazoDiasInput = document.getElementById('prazo-dias-input');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    // Elementos da tabela
    const tabelaPrazos = document.getElementById('tabela-prazos');
    const semPrazosDiv = document.getElementById('sem-prazos');
    
    // Elementos do modal de exclusão
    const modalConfirmarExclusao = new bootstrap.Modal(document.getElementById('modal-confirmar-exclusao'));
    const descricaoPrazoExclusao = document.getElementById('descricao-prazo-exclusao');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    const erroExclusaoDiv = document.getElementById('erro-exclusao');
    
    // Elementos de notificação
    const toastSucesso = new bootstrap.Toast(document.getElementById('toast-sucesso'));
    const toastErro = new bootstrap.Toast(document.getElementById('toast-erro'));
    const toastSucessoMensagem = document.getElementById('toast-sucesso-mensagem');
    const toastErroMensagem = document.getElementById('toast-erro-mensagem');
    
    // Variáveis de controle
    let prazoEmEdicao = null;
    let prazoParaExcluir = null;
    
    // Carregar lista de prazos ao iniciar
    carregarPrazos();
    
    // Função para carregar a lista de prazos
    function carregarPrazos() {
        fetch('/api/prazos')
            .then(response => response.json())
            .then(data => {
                exibirPrazos(data);
            })
            .catch(error => {
                console.error('Erro ao carregar prazos:', error);
                mostrarErro('Não foi possível carregar a lista de prazos de pagamento.');
            });
    }
    
    // Função para exibir os prazos na tabela
    function exibirPrazos(prazos) {
        tabelaPrazos.innerHTML = '';
        
        if (prazos.length === 0) {
            semPrazosDiv.classList.remove('d-none');
            return;
        }
        
        semPrazosDiv.classList.add('d-none');
        
        prazos.forEach(prazo => {
            const tr = document.createElement('tr');
            
            // Aplicar classe de destaque ao prazo
            let prazoClass = '';
            if (prazo.dias === 0) {
                prazoClass = 'prazo-pronto';
            } else if (prazo.dias <= 30) {
                prazoClass = 'prazo-30';
            } else if (prazo.dias <= 60) {
                prazoClass = 'prazo-60';
            } else {
                prazoClass = 'prazo-90';
            }
            
            tr.innerHTML = `
                <td>${prazo.codigo}</td>
                <td><span class="prazo-destaque ${prazoClass}">${prazo.descricao}</span></td>
                <td>${prazo.dias} dias</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${prazo.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${prazo.id}" data-descricao="${prazo.descricao}">
                        <i class="bi bi-trash"></i> Excluir
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = tr.querySelector('.btn-editar');
            const btnExcluir = tr.querySelector('.btn-excluir');
            
            btnEditar.addEventListener('click', function() {
                const prazoId = this.getAttribute('data-id');
                obterPrazo(prazoId);
            });
            
            btnExcluir.addEventListener('click', function() {
                const prazoId = this.getAttribute('data-id');
                const descricao = this.getAttribute('data-descricao');
                prepararExclusao(prazoId, descricao);
            });
            
            tabelaPrazos.appendChild(tr);
        });
    }
    
    // Função para obter os dados de um prazo para edição
    function obterPrazo(prazoId) {
        fetch(`/api/prazos/${prazoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Prazo não encontrado');
                }
                return response.json();
            })
            .then(prazo => {
                prepararEdicao(prazo);
            })
            .catch(error => {
                console.error('Erro ao obter prazo:', error);
                mostrarErro('Não foi possível carregar os dados do prazo.');
            });
    }
    
    // Função para preparar o formulário para edição
    function prepararEdicao(prazo) {
        prazoEmEdicao = prazo;
        
        prazoIdInput.value = prazo.id;
        prazoCodigoInput.value = prazo.codigo;
        prazoDescricaoInput.value = prazo.descricao;
        prazoDiasInput.value = prazo.dias;
        
        formTitulo.textContent = 'Editar Prazo de Pagamento';
        btnSalvar.textContent = 'Atualizar Prazo';
        btnCancelar.classList.remove('d-none');
        
        // Rolar para o formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Função para preparar o modal de exclusão
    function prepararExclusao(prazoId, descricao) {
        prazoParaExcluir = prazoId;
        descricaoPrazoExclusao.textContent = descricao;
        erroExclusaoDiv.classList.add('d-none');
        modalConfirmarExclusao.show();
    }
    
    // Event listener para o formulário
    formPrazo.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const prazoData = {
            codigo: prazoCodigoInput.value,
            descricao: prazoDescricaoInput.value,
            dias: parseInt(prazoDiasInput.value)
        };
        
        if (prazoEmEdicao) {
            // Atualizar prazo existente
            atualizarPrazo(prazoEmEdicao.id, prazoData);
        } else {
            // Criar novo prazo
            criarPrazo(prazoData);
        }
    });
    
    // Event listener para o botão cancelar
    btnCancelar.addEventListener('click', function() {
        resetarFormulario();
    });
    
    // Event listener para o botão confirmar exclusão
    btnConfirmarExclusao.addEventListener('click', function() {
        if (prazoParaExcluir) {
            excluirPrazo(prazoParaExcluir);
        }
    });
    
    // Função para criar um novo prazo
    function criarPrazo(prazoData) {
        fetch('/api/prazos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prazoData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.erro || 'Erro ao criar prazo');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarSucesso('Prazo de pagamento criado com sucesso!');
            resetarFormulario();
            carregarPrazos();
        })
        .catch(error => {
            console.error('Erro ao criar prazo:', error);
            mostrarErro(error.message);
        });
    }
    
    // Função para atualizar um prazo existente
    function atualizarPrazo(prazoId, prazoData) {
        fetch(`/api/prazos/${prazoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prazoData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.erro || 'Erro ao atualizar prazo');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarSucesso('Prazo de pagamento atualizado com sucesso!');
            resetarFormulario();
            carregarPrazos();
        })
        .catch(error => {
            console.error('Erro ao atualizar prazo:', error);
            mostrarErro(error.message);
        });
    }
    
    // Função para excluir um prazo
    function excluirPrazo(prazoId) {
        fetch(`/api/prazos/${prazoId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.erro || 'Erro ao excluir prazo');
                });
            }
            return response.json();
        })
        .then(data => {
            modalConfirmarExclusao.hide();
            mostrarSucesso('Prazo de pagamento excluído com sucesso!');
            carregarPrazos();
        })
        .catch(error => {
            console.error('Erro ao excluir prazo:', error);
            
            if (error.message.includes('sendo usado por clientes')) {
                erroExclusaoDiv.classList.remove('d-none');
            } else {
                modalConfirmarExclusao.hide();
                mostrarErro(error.message);
            }
        });
    }
    
    // Função para resetar o formulário
    function resetarFormulario() {
        prazoEmEdicao = null;
        formPrazo.reset();
        prazoIdInput.value = '';
        formTitulo.textContent = 'Adicionar Novo Prazo de Pagamento';
        btnSalvar.textContent = 'Salvar Prazo';
        btnCancelar.classList.add('d-none');
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
});