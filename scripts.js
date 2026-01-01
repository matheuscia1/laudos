document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       1️⃣ ESTADO GLOBAL / STORAGE
    ===================================================== */







    let requisicoes = JSON.parse(localStorage.getItem('requisicoes')) || [];
    let setorAtual = localStorage.getItem('setorAtual') || 'Azul';
    let contextoSetor = null;

    // USADO PARA IDENTIFICAR RETIFICACAO DE LAUDO

    let modoRetificacao = false;
    let indiceRetificacao = null;


        // ===== MEDICO SOLICITANTE - MUDAR QUANDO SISTEMA DE LOGIN ESTIVER ON =====

            // ===== (TEMPORÁRIO) =====
        const MEDICO_SOLICITANTE_PADRAO = 'Matheus';








    /* =====================================================
       2️⃣ CACHE DE ELEMENTOS DOM
    ===================================================== */











    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('overlay');
    const mainContent = document.getElementById('main-content');
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');

        // ===== CAMPOS DO FORMULÁRIO (EXAMES) =====
    const tipoExameSelect = document.getElementById('tipo-exame');
    const subtipoContainer = document.getElementById('subtipo-container');
    const subtipoSelect = document.getElementById('subtipo-exame');

    const contrasteToggle = document.getElementById('contraste-toggle');
    const contrasteContainer = document.getElementById('contraste-container');
    const funcaoRenalContainer = document.getElementById('funcao-renal-container');
    const creatininaInput = document.getElementById('creatinina');
    const creatininaIndisponivel = document.getElementById('creatinina-indisponivel');

    const urgenteToggle = document.getElementById('urgente-toggle');


    // ===== SUBMENU =====
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    const submenuParents = document.querySelectorAll('.has-submenu');









    /* =====================================================
       3️⃣ FUNÇÕES UTILITÁRIAS
    ===================================================== */










        // ===== FUNÇÃO AUXILIAR PARA FORMATAR DATA/HORA =====
        const formatarData = (iso) => {
            if (!iso) return '';

        const data = new Date(iso);

        return data.toLocaleDateString('pt-BR') + ' ' +
           data.toLocaleTimeString('pt-BR', {
               hour: '2-digit',
               minute: '2-digit'
           });
        };


         // ===== FUNÇÃO AUXILIAR – CONTADOR DE LAUDOS =====
        const atualizarContadorLaudos = (quantidade) => {
        const contador = document.getElementById('contador-laudos');
        if (!contador) return;

        contador.textContent =
            quantidade === 1
                ? '1 laudo encontrado'
                : `${quantidade} laudos encontrados`;
        };


            // ===== ATUALIZAR SETOR UI =====

        const atualizarSetorUI = () => {
            document.getElementById('setor-nome-solicitar').textContent =
                `Setor: ${setorAtual}`;
            document.getElementById('setor-nome-pendentes').textContent =
                `Setor: ${setorAtual}`;
            document.getElementById('setor-selecionado-solicitar').value =
            setorAtual;
        };



        

    // ===== FILTRO DE BUSCA =====

        const aplicarFiltrosLaudos = (lista) => {
        const paciente = document.getElementById('filtro-paciente')?.value.toLowerCase() || '';
        const tipo = document.getElementById('filtro-tipo')?.value.toLowerCase() || '';
        const setor = document.getElementById('filtro-setor')?.value || '';
        const data = document.getElementById('filtro-data')?.value || '';

        return lista.filter(r => {
        const matchPaciente = r.paciente.toLowerCase().includes(paciente);
        const matchTipo = `${r.tipo} ${r.subtipo || ''}`.toLowerCase().includes(tipo);
        const matchSetor = !setor || r.setor === setor;
        const matchData = !data || r.dataLaudo?.startsWith(data);

        return matchPaciente && matchTipo && matchSetor && matchData;
        });
    };

    // FIM - FILTRO DE BUSCA





    // ===== TOAST / SNACKBAR =====
    const showToast = (mensagem, tipo = 'info', tempo = 4000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;

    container.appendChild(toast);

        setTimeout(() => {
        toast.remove();
        }, tempo);
    };





    const confirmAction = (mensagem, onConfirm) => {
    const modal = document.createElement('div');
    modal.className = 'confirm-overlay';

    modal.innerHTML = `
        <div class="confirm-box">
            <p>${mensagem}</p>
            <div class="confirm-actions">
                <button class="btn-cancelar">Cancelar</button>
                <button class="btn-confirmar">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-cancelar').onclick = () => {
        modal.remove();
    };

    
    ativarAtalhosConfirmacao(modal);


    modal.querySelector('.btn-confirmar').onclick = () => {
        modal.remove();
        onConfirm();
        };
    };




    // ATALHO TECLADO PARA CONFIRMAR E CANCELAR - ENTER / ESC

    const ativarAtalhosConfirmacao = (modalEl) => {
    if (!modalEl) return;

    const botoes = modalEl.querySelectorAll('button');

    const btnConfirmar = [...botoes].find(b =>
        b.textContent.trim().toLowerCase().includes('confirmar')
    );

    const btnCancelar = [...botoes].find(b =>
        b.textContent.trim().toLowerCase().includes('cancelar')
    );

    const handler = (e) => {
        if (e.key === 'Enter' && btnConfirmar) {
            e.preventDefault();
            btnConfirmar.click();
        }

        if (e.key === 'Escape' && btnCancelar) {
            e.preventDefault();
            btnCancelar.click();
        }
    };

    document.addEventListener('keydown', handler);

    const remover = () => {
        document.removeEventListener('keydown', handler);
    };

    btnConfirmar?.addEventListener('click', remover);
    btnCancelar?.addEventListener('click', remover);
    };






    // FUNCAO LIBERAR LAUDO


    window.liberarLaudo = (index) => {
    confirmAction('Deseja liberar este laudo?', () => {

        requisicoes[index].status = 'em_revisao';
        requisicoes[index].dataLiberacao = new Date().toISOString();

        localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

        renderLaudos();
        renderMeusLaudos();

        showToast(
            'Laudo em revisão.',
            'info'
         );
      });
    };



    // ⏱️ EMISSÃO AUTOMÁTICA APÓS 30 MINUTOS

    const verificarLaudosEmRevisao = () => {
    const agora = Date.now();
    const LIMITE = 30 * 1000; // 30 segundos (TESTE)

        // MUDANÇA PARA TESTES:
        // const LIMITE = 30 * 1000; // 30 segundos (TESTE)
        // const LIMITE = 30 * 60 * 1000; // 30 minutos (PRODUCAO)


    let alterou = false;

    requisicoes.forEach(r => {
        if (r.status === 'em_revisao' && r.dataLiberacao) {
            const tempo = agora - new Date(r.dataLiberacao).getTime();

            if (tempo >= LIMITE) {
                r.status = 'laudo_emitido';
                r.dataLaudo = r.dataLiberacao;
                alterou = true;
                }
            }
        });

        if (alterou) {
            localStorage.setItem('requisicoes', JSON.stringify(requisicoes));
            }
    };




    // ⏱️ Verificação automática de laudos em revisão
    verificarLaudosEmRevisao(); // roda imediatamente ao abrir o sistema

    setInterval(() => {
        verificarLaudosEmRevisao();
        renderLaudos();
        renderMeusLaudos();
    }, 60_000); // a cada 1 minuto




    // FUNÇÃO DE RENOMEAR LAUDOS RETIFICADOS

    const gerarNomeLaudoRetificado = (nomeOriginal) => {
    const match = nomeOriginal.match(/_retificado\((\d+)\)/);
    const contadorAtual = match ? parseInt(match[1], 10) : 0;
    const proximo = contadorAtual + 1;

    const base = nomeOriginal.replace(/_retificado\(\d+\)/, '');
    const partes = base.split('.');

    return `${partes[0]}_retificado(${proximo}).${partes[1]}`;
    };




    // FUNCAO CREATININA

    const formatarCreatinina = (valor) => {
    if (!valor) return '';

    // mantém apenas números e vírgula
    valor = valor.replace(/[^\d,]/g, '');

    // só permite uma vírgula
    const partes = valor.split(',');
    let inteiro = partes[0] || '0';
    let decimal = partes[1] || '';

    // remove zeros à esquerda (mantém 0)
    inteiro = inteiro.replace(/^0+(?!$)/, '');

    // limita a 2 casas decimais
    decimal = decimal.slice(0, 2);

    return partes.length > 1
        ? `${inteiro},${decimal}`
        : inteiro;
    };

            // FUNCAO DE CORES 
            
            const aplicarCorCreatinina = () => {
            if (creatininaInput.disabled) return;

            const valor = creatininaInput.value.replace(',', '.');
            const numero = parseFloat(valor);

            // Remove cores anteriores
            creatininaInput.classList.remove(
                'creatinina-alerta',
                'creatinina-critica'
            );

            if (isNaN(numero)) return;

            if (numero > 3.0) {
                creatininaInput.classList.add('creatinina-critica');
            } else if (numero > 2.0) {
                creatininaInput.classList.add('creatinina-alerta');
            }
            };













            


    /* =====================================================
       4️⃣ RENDERS (INTERFACE)
    ===================================================== */









    // ===== PENDENTES =====
    const renderRequisicoes = () => {
        const container = document.getElementById('requisicoes-container');
        container.innerHTML = '';

        const lista = requisicoes.filter(
            r =>
                r.setor === setorAtual &&
                r.status === 'solicitado'
        );

        if (!lista.length) {
            container.innerHTML =
                '<p class="empty-message">Nenhuma pendente</p>';
            return;
        }

        lista.forEach((r, i) => {

    const status = r.status || 'solicitado';

    const statusLabel =
    r.status === 'solicitado'
        ? '<span class="badge-status badge-solicitado">Solicitado</span>'
    : r.status === 'em_exame'
        ? '<span class="badge-status badge-em-exame">Em exame</span>'
    : r.status === 'aguardando_revisao'
        ? '<span class="badge-status badge-revisao">Aguardando revisão</span>'
    : r.status === 'em_revisao'
        ? '<span class="badge-status badge-em-revisao">Em revisão</span>'
    : r.status === 'cancelado'
        ? '<span class="badge-status badge-cancelado">Cancelado</span>'
    : r.status === 'laudo_emitido'
        ? '<span class="badge-status badge-laudo">Laudo emitido</span>'
    : '';

            

            
    container.innerHTML += `
        
    <div class="requisicao-card requisicao-card-linha card-expansivel">

        <div class="requisicao-header">
            
            <!-- LINHA PRINCIPAL (sempre visível) -->
            <div class="requisicao-linha resumo">
                <span><strong>Paciente:</strong> ${r.paciente}</span>

                <span>
                    <strong>Tipo:</strong>
                    ${r.tipo}${r.subtipo ? ' - ' + r.subtipo : ''}
                    ${
                        r.tipo === 'TC'
                            ? (r.contraste
                                ? ' <span class="contraste">com contraste</span>'
                                : ' sem contraste')
                            : ''
                    }
                </span>

                <span class="data-info">
                    <strong>Solicitado em:</strong>
                    ${formatarData(r.dataSolicitacao)}
                    ${r.urgente ? ' - <span class="urgente">URGENTE</span>' : ''}
                </span>

                    <i class="icone-expansivel"></i>

            </div>

        </div>

        <!-- CONTEÚDO EXPANDIDO -->
        <div class="requisicao-detalhes">
            <div class="requisicao-linha detalhes">
                <span><strong>Solicitante:</strong> Dr. ${r.solicitante || '---'}</span>

                
                    <span style="flex-basis: 100%;">
                        <strong>Indicação:</strong> ${r.descricao || '—'}
                    </span>
                
                <!-- futuras infos aqui -->
            </div>

            
        </div>


            <div class="status-linha">
                ${statusLabel}
            </div>


        </div>
    `;

                

        });

              
    };


    // ===== MINHAS REQUISIÇÕES =====
    const renderMinhasRequisicoes = () => {
    const container = document.getElementById('minhas-requisicoes-container');
    container.innerHTML = '';

    const minhas = requisicoes.filter(
        r => r.solicitante === MEDICO_SOLICITANTE_PADRAO
    );

    if (!minhas.length) {
        container.innerHTML =
            '<p class="empty-message">Você ainda não possui requisições.</p>';
        return;
    }

    minhas.forEach((r, i) => {

        const statusLabel =
        r.status === 'solicitado'
            ? '<span class="badge-status badge-solicitado">Solicitado</span>'
        : r.status === 'em_exame'
            ? '<span class="badge-status badge-em-exame">Em exame</span>'
        : r.status === 'aguardando_revisao'
            ? '<span class="badge-status badge-revisao">Aguardando revisão</span>'
        : r.status === 'em_revisao'
            ? '<span class="badge-status badge-em-revisao">Em revisão</span>'
        : r.status === 'cancelado'
            ? '<span class="badge-status badge-cancelado">Cancelado</span>'
        : '<span class="badge-status badge-laudo">Laudo emitido</span>';


        container.innerHTML += `
            <div class="requisicao-card">
                <div>
                    <p><strong>Paciente:</strong> ${r.paciente}</p>

                    <p><strong>Tipo:</strong>
                        ${r.tipo}${r.subtipo ? ' - ' + r.subtipo : ''}
                        ${
                            r.tipo === 'TC'
                                ? (
                                    r.contraste
                                        ? ' <span class="contraste">com contraste</span>'
                                        : ' sem contraste'
                                  )
                                : ''
                        }
                    </p>

                    <p class="data-info">
                        <strong>Solicitado em:</strong>
                        ${formatarData(r.dataSolicitacao)}
                        ${r.urgente ? ' - <span class="urgente">URGENTE</span>' : ''}
                    </p>

                    ${statusLabel}
                </div>

                <div class="acoes-minhas">

                <button class="btn-editar" disabled>Editar</button>

                    ${
                        r.status === 'solicitado'
                            ? `
                                <button class="btn-excluir" onclick="excluirRequisicao(${i})">
                                    Excluir
                                </button>
                            `
                            : `
                                <button class="btn-excluir" disabled>
                                    Excluir
                                </button>
                            `
                    }
                </div>
            </div>
        `;
        });
    };


    // ===== EXAMES A REALIZAR (RADIOLOGIA) =====
    const renderExamesRealizar = () => {
    const container = document.getElementById('exames-realizar-container');
    container.innerHTML = '';

    requisicoes.forEach((r, index) => {

        if (r.status !== 'solicitado') return;

        container.innerHTML += `
            <div class="requisicao-card">
                <div>
                    <p><strong>Paciente:</strong> ${r.paciente}</p>

                    <p><strong>Tipo:</strong>
                        ${r.tipo}${r.subtipo ? ' - ' + r.subtipo : ''}
                        ${
                            r.tipo === 'TC'
                                ? (
                                    r.contraste
                                        ? ' <span class="contraste">com contraste</span>'
                                        : ' sem contraste'
                                  )
                                : ''
                        }
                    </p>

                    <p><strong>Setor:</strong> ${r.setor}</p>

                    <p class="data-info">
                        <strong>Solicitado em:</strong>
                        ${formatarData(r.dataSolicitacao)}
                        ${r.urgente ? ' - <span class="urgente">URGENTE</span>' : ''}
                    </p>
                </div>

                <div class="acoes-radiologia">
                    <button onclick="abrirFormLaudo(${index})">Realizar</button>
                    <button disabled>Editar</button>
                    <button onclick="cancelarExame(${index})">Cancelar</button>
                </div>
            </div>
        `;
    });

    if (!container.innerHTML) {
        container.innerHTML =
            '<p class="empty-message">Nenhum exame disponível.</p>';
        }
    };

    // FIM - EXAMES A REALIZAR (RADIOLOGIA)



    // ===== VISUALIZAR LAUDOS (TODOS) =====

    const renderLaudos = () => {
    const container = document.getElementById('laudos-container');
    container.innerHTML = '';

    const laudos = aplicarFiltrosLaudos(
    requisicoes.filter(r =>
    ['aguardando_revisao', 'em_revisao', 'laudo_emitido'].includes(r.status)
        )
    );

        atualizarContadorLaudos(laudos.length);


    if (!laudos.length) {
        container.innerHTML =
            '<p class="empty-message">Nenhum laudo disponível.</p>';
        return;
    }

    laudos.forEach((r, index) => {
        
        
        // BADGE DE STATUS
        const statusLabel =
            r.status === 'aguardando_revisao'
                ? '<span class="badge-status badge-revisao">Aguardando revisão</span>'
            : r.status === 'em_revisao'
                ? '<span class="badge-status badge-em-revisao">Em revisão</span>'
            : r.status === 'laudo_emitido'
                ? '<span class="badge-status badge-laudo">Laudo emitido</span>'
            : '';
        // FIM DO BADGE DE STATUS
        
        
        container.innerHTML += `
            <div class="requisicao-card laudo-card">

                <div class="laudo-linha">
                    <span><strong>Paciente:</strong> ${r.paciente}</span>
                    <span>
                        <strong>${r.tipo}</strong>${r.subtipo ? ' - ' + r.subtipo : ''}
                    </span>
                    <span><strong>Setor:</strong> ${r.setor}</span>
                    <span>
                        <strong>Laudo em:</strong>
                        ${formatarData(r.dataLaudo)}
                        ${r.status === 'laudo_emitido' && r.laudoRetificado ? ' – retificado' : ''}
                    </span>
                </div>


                ${statusLabel}


                <div class="acoes-laudo">
                    <a href="Laudos/${r.laudo.nome}" target="_blank" class="btn-laudo">
                        Abrir
                    </a>
                    <a href="Laudos/${r.laudo.nome}" download class="btn-laudo secondary">
                        Baixar
                    </a>                    
                </div>

            </div>
        `;
        });
    };



    // FIM - VISUALIZAR LAUDOS (TODOS)



    // ===== MEUS LAUDOS (DO SOLICITANTE) =====

    const renderMeusLaudos = () => {
    const container = document.getElementById('meus-laudos-container');
    container.innerHTML = '';

    const meus = aplicarFiltrosLaudos(
    requisicoes.filter(r =>
        ['aguardando_revisao', 'em_revisao', 'laudo_emitido'].includes(r.status) &&
        r.solicitante === MEDICO_SOLICITANTE_PADRAO
        )
    );


        atualizarContadorLaudos(meus.length);


    if (!meus.length) {
        container.innerHTML =
            '<p class="empty-message">Você ainda não possui laudos.</p>';
        return;
    }

    meus.forEach((r, index) => {

        const indexReal = requisicoes.indexOf(r);

        // BADGES DE STATUS
        const statusLabel =
        r.status === 'aguardando_revisao'
            ? '<span class="badge-status badge-revisao">Aguardando revisão</span>'
        : r.status === 'em_revisao'
            ? '<span class="badge-status badge-em-revisao">Em revisão</span>'
        : r.status === 'laudo_emitido'
            ? '<span class="badge-status badge-laudo">Laudo emitido</span>'
        : '';
        // FIM BADGES

        container.innerHTML += `
            <div class="requisicao-card laudo-card">

                <div class="laudo-linha">
                    <span><strong>Paciente:</strong> ${r.paciente}</span>

                    <span>
                        <strong>${r.tipo}</strong>${r.subtipo ? ' - ' + r.subtipo : ''}
                    </span>

                    <span><strong>Setor:</strong> ${r.setor}</span>

                    <span class="data-info">
                        <strong>Laudo em:</strong>
                        ${formatarData(r.dataLaudo)}
                        ${r.status === 'laudo_emitido' && r.laudoRetificado ? ' – retificado' : ''}
                    </span>
                </div>


                ${statusLabel}



                <div class="acoes-laudo">
                    
                    ${
                        r.laudo
                            ? `
                                <a href="Laudos/${r.laudo.nome}" target="_blank" class="btn-laudo">
                                    Abrir
                                </a>

                                <a href="Laudos/${r.laudo.nome}" download class="btn-laudo secondary">
                                    Baixar
                                </a>
                            `
                            : `
                                <span class="laudo-pendente">
                                    Laudo ainda não disponível
                                </span>
                            `
                    }

                    ${
                        r.status === 'aguardando_revisao'
                            ? `
                                <button class="btn-laudo editar" onclick="abrirFormLaudo(${index})">
                                    Editar
                                </button>
                                <button class="btn-laudo assinar" onclick="liberarLaudo(${index})">
                                    Liberar
                                </button>
                            `
                        : r.status === 'em_revisao'
                            ? `
                                <button class="btn-laudo editar" onclick="abrirFormLaudo(${index})">
                                    Editar
                                </button>
                            `
                        : r.status === 'laudo_emitido'
                            ? `
                                <button class="btn-laudo secondary" onclick="retificarLaudo(${index})">
                                    Retificar
                                </button>
                            `
                        : ''
                    }

                                </div>
            </div>
            `;
        });
    };


// FIM - MEUS LAUDOS (DO SOLICITANTE)








    /* =====================================================
       5️⃣ AÇÕES DE NEGÓCIO
    ===================================================== */








    // ===== FUNCAO CANCELAR =====

    window.cancelarExame = (i) => {
    confirmAction('Deseja cancelar este exame?', () => {
        requisicoes[i].status = 'cancelado';
        localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

        renderExamesRealizar();
        renderRequisicoes();
        renderMinhasRequisicoes();

        showToast('Exame cancelado.', 'warning');
        });
    };

    // FIM FUNCAO CANCELAR


    // ===== FUNCAO EM EXAME =====

    window.abrirFormLaudo = (i) => {
    const form = document.getElementById('form-laudo');

    // DEFINE O MODO DO FORMULÁRIO
    if (requisicoes[i].status === 'laudo_emitido') {
        form.dataset.modo = 'retificar';
    } 
    else if (
        requisicoes[i].status === 'aguardando_revisao' ||
        requisicoes[i].status === 'em_revisao'
    ) {
        form.dataset.modo = 'editar';
    } 
    else {
        form.dataset.modo = 'novo';
    }

    // ⚠️ Só muda para "em_exame" se ainda estiver como solicitado
    if (requisicoes[i].status === 'solicitado') {
        requisicoes[i].status = 'em_exame';
        requisicoes[i].dataInicioExame = new Date().toISOString();
    }

    localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

    renderExamesRealizar();
    renderRequisicoes();
    renderMinhasRequisicoes();

    document.getElementById('requisicao-id').value = i;
    document.getElementById('realizar-exame-section').style.display = 'block';
    location.hash = 'realizar-exame-section';
    };







    // FIM - FUNCAO EM EXAME


    // ===== ASSINAR LAUDO =====
    


    window.assinarLaudo = (index) => {
    confirmAction('Deseja assinar este laudo?', () => {
        requisicoes[index].assinatura = {
            medico: MEDICO_SOLICITANTE_PADRAO,
            data: new Date().toISOString()
        };

        localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

        // 🔁 Atualiza as telas
        renderLaudos();
        renderMeusLaudos();

        // ✅ Feedback correto
        showToast('Laudo assinado com sucesso!', 'success');
        });
    };


    // FIM - ASSINAR LAUDO



    // FUNCAO DE RETIFICACAO DE LAUDO

    window.retificarLaudo = (index) => {
    // NÃO muda status
    // NÃO altera datas do exame
    // Apenas abre o formulário reaproveitando o mesmo laudo

    document.getElementById('requisicao-id').value = index;
    document.getElementById('realizar-exame-section').style.display = 'block';

    // marcador opcional para o submit saber que é retificação
    document.getElementById('form-laudo').dataset.retificacao = 'true';

    location.hash = 'realizar-exame-section';
    };






    /* =====================================================
       6️⃣ NAVEGAÇÃO
    ===================================================== */






    const showPage = (pageId) => {

        const filtros = document.getElementById('laudos-filtros-wrapper');

            if (filtros) {
                if (pageId === 'visualizar-laudos' || pageId === 'meus-laudos') {
                    filtros.style.display = 'block';
                } else {
                    filtros.style.display = 'none';
                }
            }


            if (filtros && pageId !== 'visualizar-laudos' && pageId !== 'meus-laudos') {
                document.getElementById('filtro-paciente').value = '';
                document.getElementById('filtro-tipo').value = '';
                document.getElementById('filtro-setor').value = '';
                document.getElementById('filtro-data').value = '';
            }



        pages.forEach(p => p.classList.remove('active'));
        const page = document.getElementById(pageId);
        if (page) page.classList.add('active');

        const titles = {
            painel: 'Painel',
            'solicitar-exame': 'Solicitar Exame',
            pendentes: 'Requisições por setor',
            'minhas-requisicoes': 'Minhas requisições',
            'exames-realizar': 'Exames a realizar',
            laudos: 'Laudos',
            'visualizar-laudos': 'Visualizar laudos',
            'meus-laudos': 'Meus laudos',
            estatisticas: 'Estatísticas',
            configuracoes: 'Configurações',
            sair: 'Sair'
        };
        pageTitle.textContent = titles[pageId] || 'Painel';

        if ([

            'solicitar-exame',
            'pendentes',
            'minhas-requisicoes',
            'exames-realizar',
            'visualizar-laudos',
            'meus-laudos'
        
        ].includes(pageId)) {
            atualizarSetorUI();

            if (pageId === 'pendentes') renderRequisicoes();
            if (pageId === 'minhas-requisicoes') renderMinhasRequisicoes();
            if (pageId === 'exames-realizar') { renderExamesRealizar(); }
            if (pageId === 'visualizar-laudos') renderLaudos();
            if (pageId === 'meus-laudos') renderMeusLaudos();

            }
    };



    // ===== MODAL GLOBAL DE SETOR =====
    const setorModal = document.getElementById('setor-selector-panel');
    const setorOverlay = document.getElementById('setor-modal-overlay');
    const fecharSetorBtn = document.getElementById('fechar-setor-panel');
    const botoesSetor = setorModal.querySelectorAll('.btn-setor');

    const abrirModalSetor = (contexto) => {
        contextoSetor = contexto;
        setorModal.style.display = 'block';
        setorOverlay.classList.add('active');
    };

    const fecharModalSetor = () => {
        setorModal.style.display = 'none';
        setorOverlay.classList.remove('active');
    };







    // ===== EXCLUIR REQUISIÇÃO (somente se solicitado) =====
    window.excluirRequisicao = (index) => {
    confirmAction('Deseja excluir esta solicitação?', () => {

        // Segurança extra (regra de negócio)
        if (requisicoes[index].status !== 'solicitado') {
            showToast(
                'Só é possível excluir exames com status "Solicitado".',
                'warning'
            );
            return;
        }

        requisicoes.splice(index, 1);

        localStorage.setItem(
            'requisicoes',
            JSON.stringify(requisicoes)
        );

        renderMinhasRequisicoes();
        renderRequisicoes();
        renderExamesRealizar();

        showToast('Solicitação excluída', 'warning');
        });
    };
















    /* =====================================================
       7️⃣ EVENTOS / HANDLERS
    ===================================================== */


    window.addEventListener('hashchange', () => {
        showPage(location.hash.slice(1) || 'painel');
    });

    navLinks.forEach(link => {
        link.onclick = e => {
            e.preventDefault();
            location.hash = link.getAttribute('href');
        };
    });

    showPage(location.hash.slice(1) || 'painel');



    // ===== SUBMENU  =====

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = toggle.closest('.has-submenu');

            submenuParents.forEach(p => {
                if (p !== parent) p.classList.remove('open');
            });

            parent.classList.toggle('open');
        });
    });




    // ===== ATUALIZA AO DIGITAR - FILTRO DE BUSCA =====

    [
    'filtro-paciente',
    'filtro-tipo',
    'filtro-setor',
    'filtro-data'
    ].forEach(id => {
    const el = document.getElementById(id);
        if (el) {
        el.addEventListener('input', () => {
            if (location.hash === '#visualizar-laudos') renderLaudos();
            if (location.hash === '#meus-laudos') renderMeusLaudos();
        });
        }
    });

    document.getElementById('limpar-filtros')?.addEventListener('click', () => {
    document.getElementById('filtro-paciente').value = '';
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-setor').value = '';
    document.getElementById('filtro-data').value = '';

    if (location.hash === '#visualizar-laudos') renderLaudos();
    if (location.hash === '#meus-laudos') renderMeusLaudos();
    });



    // FIM - ATUALIZA AO DIGITAR - FILTRO DE BUSCA



    // ===== SIDEBAR =====
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    };

    mobileMenuBtn.onclick = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    };

    overlay.onclick = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    // FIM - SIDEBAR



    // ===== MODAL GLOBAL DE SETOR  / .ONCLICK =====

    fecharSetorBtn.onclick = fecharModalSetor;
    setorOverlay.onclick = fecharModalSetor;

    document.getElementById('alterar-setor-solicitar').onclick =
        () => abrirModalSetor('solicitar');

    document.getElementById('alterar-setor-pendentes').onclick =
        () => abrirModalSetor('pendentes');

    botoesSetor.forEach(btn => {
        btn.onclick = () => {
            setorAtual = btn.dataset.setor;
            localStorage.setItem('setorAtual', setorAtual);
            atualizarSetorUI();
            if (contextoSetor === 'pendentes') renderRequisicoes();
            fecharModalSetor();
        };
    });



    // ===== FORM SOLICITAÇÃO =====
    document.getElementById('form-solicitacao').onsubmit = e => {
        e.preventDefault();
        requisicoes.push({
            paciente: paciente.value,
            tipo: tipoExameSelect.value,
            subtipo: subtipoSelect.value || null,
            contraste: contrasteToggle.checked,
            funcaoRenal: contrasteToggle.checked
                    ? {
                        creatinina: creatininaIndisponivel.checked
                            ? null
                            : creatininaInput.value
                    }
                    : null,
            setor: setorAtual,
            solicitante: MEDICO_SOLICITANTE_PADRAO,
            descricao: descricao.value,
            urgente: urgenteToggle.checked,
            status: 'solicitado',
            dataSolicitacao: new Date().toISOString(),
            dataInicioExame: null,
            dataLaudo: null,
            laudo: null
        });


        localStorage.setItem('requisicoes', JSON.stringify(requisicoes));
        showToast('Exame solicitado!', 'success');
    


        // ✅ Limpa todos os campos
        e.target.reset();

        // ✅ Esconde o subtipo
        subtipoContainer.style.display = 'none';
        subtipoSelect.innerHTML = '<option value="">Selecione</option>';
        subtipoSelect.required = false;

        // ✅ Reseta e esconde contraste e função renal
        contrasteToggle.checked = false;
        contrasteContainer.style.display = 'none';
        funcaoRenalContainer.style.display = 'none';

    };





    // ===== SUBTIPOS CADASTRADOS =====

    if (tipoExameSelect) {
    
    const subtiposUltrassom = [
        'Abdome total',
        'Abdome superior',
        'Aparelho urinário',
        'Próstata via abdominal',
        'Pélvico (feminino)',
        'Cervical',
        'Partes moles',
        'Transvaginal',
        'Tórax',
        'Obstétrico',
        'Doppler venoso de membro',
        'Doppler de carótidas',
        'Outro'
    ];

    const subtiposTC = [
        'Crânio',
        'Tórax',
        'Abdome total',
        'Abdome superior',
        'Abdome inferior',
        'Coluna cervical',
        'Coluna torácica',
        'Coluna lombossacra',
        'Outro'
    ];


    // ===== CONTROLE DE SUBTIPO DE EXAME =====
    tipoExameSelect.addEventListener('change', () => {
    subtipoSelect.innerHTML = '<option value="">Selecione</option>';

    let subtipos = [];

    if (tipoExameSelect.value === 'Ultrassonografia') {
        subtipos = subtiposUltrassom;
    } else if (tipoExameSelect.value === 'TC') {
        subtipos = subtiposTC;
    }

    if (subtipos.length > 0) {
        subtipos.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            subtipoSelect.appendChild(opt);
        });
        subtipoContainer.style.display = 'block';
        subtipoSelect.required = true;
    } else {
        subtipoContainer.style.display = 'none';
        subtipoSelect.required = false;
    }
    });


    // ===== TOGGLE DE CONTRASTE PARA TC =====

    const contrasteToggle = document.getElementById('contraste-toggle');
    const contrasteContainer = document.getElementById('contraste-container');
    const funcaoRenalContainer = document.getElementById('funcao-renal-container');

    tipoExameSelect.addEventListener('change', () => {
        contrasteToggle.checked = false;
        funcaoRenalContainer.style.display = 'none';

        if (tipoExameSelect.value === 'TC') {
            contrasteContainer.style.display = 'block';
        } else {
            contrasteContainer.style.display = 'none';
        }
    });

    contrasteToggle.addEventListener('change', () => {
        if (contrasteToggle.checked) {
            funcaoRenalContainer.style.display = 'block';
            if (!creatininaIndisponivel.checked) {
                creatininaInput.required = true;
            }
        } else {
            funcaoRenalContainer.style.display = 'none';
            creatininaInput.required = false;
            creatininaInput.value = '';
        }
    });

    

    // ===== TOGGLE URGENTE =====

    const urgenteToggle = document.getElementById('urgente-toggle');

    }

  
      
    // ===== ENVIO DO LAUDO =====
    document.getElementById('form-laudo').onsubmit = async (e) => {
    e.preventDefault();

    const index = parseInt(document.getElementById('requisicao-id').value);
    const paciente = requisicoes[index].paciente;
    const setor = requisicoes[index].setor;
    const tipoExame = requisicoes[index].tipo;
    // Se ainda não existir prontuário no sistema
    const prontuario = requisicoes[index].prontuario?.trim() || 'semprontuario';
    
     // 🔎 IDENTIFICA SE É RETIFICAÇÃO
    const isRetificacao =
        document.getElementById('form-laudo').dataset.retificacao === 'true';


    const arquivo = document.getElementById('laudo-arquivo').files[0];
    const comentarios = document.getElementById('comentarios').value;

    if (!arquivo || arquivo.type !== 'application/pdf') {
        alert('Selecione um arquivo PDF válido.');
        return;
    }

    const modo =
        requisicoes[index].status === 'laudo_emitido'
            ? 'retificar'
            : requisicoes[index].laudo
                ? 'editar'
                : 'novo';

    const formData = new FormData();
    formData.append('laudo', arquivo);
    formData.append('paciente', requisicoes[index].paciente);
    formData.append('prontuario', requisicoes[index].prontuario || 'sem_prontuario');
    formData.append('setor', requisicoes[index].setor);
    formData.append('tipo', requisicoes[index].tipo);
    formData.append('modo', modo);

    // usado APENAS no modo editar
    if (modo === 'editar') {
        formData.append('arquivo_atual', requisicoes[index].laudo.nome);
    }

    try {
        const response = await fetch('upload-laudo.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.sucesso) {
            showToast(`Erro ao salvar laudo: ${result.erro}`, 'error');
            return;
        }

        // Atualiza dados locais

        const jaExisteLaudo = !!requisicoes[index].laudo;

       const isRetificacao =
    requisicoes[index].status === 'laudo_emitido';

    if (isRetificacao) {
        // ✏️ RETIFICAÇÃO REAL (apenas após emissão)
        requisicoes[index].laudo = {
            nome: result.arquivo,
            comentarios
        };

        requisicoes[index].laudoRetificado = true;
        requisicoes[index].dataRetificacao = new Date().toISOString();

        // 🔒 status NÃO muda
    } else {
        // ✏️ EDIÇÃO NORMAL ou PRIMEIRO LAUDO
        requisicoes[index].laudo = {
            nome: result.arquivo,
            comentarios
        };

        requisicoes[index].laudoRetificado = false;
        requisicoes[index].dataRetificacao = null;

        if (
            requisicoes[index].status === 'solicitado' ||
            requisicoes[index].status === 'em_exame'
        ) {
            requisicoes[index].status = 'aguardando_revisao';
            requisicoes[index].dataLiberacao = null;
            requisicoes[index].dataLaudo = new Date().toISOString();
        }
    }







        localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

        document.getElementById('realizar-exame-section').style.display = 'none';
        document.getElementById('form-laudo').reset();

        renderRequisicoes();
        location.hash = 'pendentes';

        showToast('Exame cadastrado!', 'success');

        } catch (err) {
        alert('Erro de comunicação com o servidor.');
        console.error(err);
        }
    };





    // ===== LISTENER CREATININA =====
    creatininaInput.addEventListener('input', () => {
    if (creatininaInput.disabled) return;

    // permite apenas números e vírgula (NÃO formata aqui)
    creatininaInput.value = creatininaInput.value.replace(/[^\d,]/g, '');

    aplicarCorCreatinina();
    });

    creatininaInput.addEventListener('blur', () => {
    if (creatininaInput.disabled) return;

    creatininaInput.value = formatarCreatinina(creatininaInput.value);
    aplicarCorCreatinina();
    });



    if (creatininaIndisponivel) {
        creatininaIndisponivel.addEventListener('change', () => {
            if (creatininaIndisponivel.checked) {
                creatininaInput.value = '';
                creatininaInput.disabled = true;
                creatininaInput.required = false;

                creatininaInput.classList.remove(
                    'creatinina-alerta',
                    'creatinina-critica'
                );
            } else {
                creatininaInput.disabled = false;
                creatininaInput.required = true;
            }
        });
    }





    // ===== ACCORDION DOS FILTROS (MOBILE) =====
    const toggleFiltrosBtn = document.getElementById('toggle-filtros');
    const filtros = document.querySelector('.laudos-filtros');

    if (toggleFiltrosBtn && filtros) {
        toggleFiltrosBtn.addEventListener('click', () => {
            filtros.classList.toggle('aberto');

            toggleFiltrosBtn.textContent =
                filtros.classList.contains('aberto')
                    ? '❌ Ocultar filtros'
                    : '🔍 Mostrar filtros';
        });
    }





    // ===== CANCELAR FORMULÁRIO DE LAUDO (NÃO cancela o exame) =====
    document.getElementById('cancelar-laudo')?.addEventListener('click', () => {
    const index = parseInt(
        document.getElementById('requisicao-id').value
    );

    // 🔙 Se estava apenas em edição/início de exame, volta para solicitado
    if (requisicoes[index]?.status === 'em_exame') {
        requisicoes[index].status = 'solicitado';
        requisicoes[index].dataInicioExame = null;
    }

    localStorage.setItem('requisicoes', JSON.stringify(requisicoes));

    // Fecha formulário
    document.getElementById('realizar-exame-section').style.display = 'none';
    document.getElementById('form-laudo').reset();

    // Atualiza telas
    renderExamesRealizar();
    renderRequisicoes();
    renderMinhasRequisicoes();

    location.hash = 'pendentes';
});




// ===== CARD EXPANSÍVEL =====

const requisicoesContainer = document.getElementById('requisicoes-container');

if (requisicoesContainer) {
    requisicoesContainer.addEventListener('click', (e) => {

        // ⛔ ignora cliques em ações internas
        if (e.target.closest('button, a')) return;

        const card = e.target.closest('.card-expansivel');
        if (!card) return;

        const jaAberto = card.classList.contains('aberto');

        // Fecha todos
        document
            .querySelectorAll('.card-expansivel.aberto')
            .forEach(c => c.classList.remove('aberto'));

        // Abre apenas se não estava aberto
        if (!jaAberto) {
            card.classList.add('aberto');
        }
    });
};



});




