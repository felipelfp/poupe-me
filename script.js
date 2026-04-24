/**
 * CONFIGURAÇÃO DO SITE — edite só este bloco.
 * Salvar o arquivo já grava no disco; commit no Git é opcional (só quando quiser versionar/enviar).
 *
 * Make: recebe JSON com nome, telefone, empresa, origem, respostas do diagnóstico (array + texto + P1–P3).
 * FormSubmit: use formSubmitEmail OU formSubmitFullUrl. No primeiro envio real, abra o e-mail e confirme o link do FormSubmit.
 * Dica: atributos data-formsubmit / data-formsubmit-email no <body> do index.html ainda podem sobrescreber (útil em testes).
 */
const SITE_CONFIG = {
    makeWebhookUrl: 'https://hook.us1.make.com/6v30h5vujr9vlygexndx77q2fujv7f7v',
    formSubmitEmail: 'felipe008lucas@gmail.com',
    formSubmitFullUrl: ''
};

const CaminhoGame = {
    state: 'dialog',
    wizard: null,
    vendorContainer: null,
    world: null,
    dialogBox: null,
    score: 0,
    obstacles: [],
    vendors: [],
    speed: 5,
    /** Base da corrida (definida no init, mobile um pouco menor). A partir de 80 pts acelera; a cada +20 acelera de novo. */
    baseRunSpeed: 5,
    isJumping: false,
    gameActive: false,
    animationId: null,
    /** Aumenta levemente a frequência de caixas depois que o jogador começa a pular (com teto pra não ficar impossível). */
    totalJumps: 0,
    questionsAnswered: 0,
    isWalkingToVendor: false,
    currentVendor: null,
    consultationUnlocked: false,
    consultationShown: false,
    runnerMode: false,
    userAnswers: [],
    
    dialogs: [
        {
            title: "PERFIL DE COMPRAS",
            text: "Os materiais de limpeza, papelaria, copa e descartáveis são comprados via?",
            options: [
                { text: "Cotações abertas de forma recorrente" },
                { text: "Comodato" },
                { text: "Contrato com preços fixos" }
            ]
        },
        {
            title: "ESSENCIAL",
            text: "Quais opções estão com base em sua estratégia de compra desses insumos?",
            options: [
                { text: "Preço menor" },
                { text: "Produtos de qualidade" },
                { text: "Entrega rápida" },
                { text: "Desenvolvimento de parceria" }
            ]
        },
        {
            title: "DESAFIOS",
            text: "O que é mais desafiador na sua operação de compras hoje?",
            options: [
                { text: "Padronização de insumos de uso e consumo" },
                { text: "Compras descentralizadas e recorrentes" },
                { text: "Previsibilidade de custos, preços que variam muito a todo tempo" }
            ]
        }
    ],

    init() {
        this.wizard = document.getElementById('caminho-wizard');
        this.vendorContainer = document.getElementById('caminho-vendor-container');
        this.world = document.getElementById('caminho-world');
        this.dialogBox = document.getElementById('caminho-dialog-box');
        this.baseRunSpeed = window.innerWidth < 768 ? 4 : 5;
        this.speed = this.baseRunSpeed;
        
        this.startDialogueSequence();
        this.setupForm();
        this.initMapa();

        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.gameActive) {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Toque na tela para pular (mobile)
        document.addEventListener('touchstart', (e) => {
            if (this.gameActive) {
                e.preventDefault();
                this.jump();
            }
        }, { passive: false });
        
        document.addEventListener('pointerdown', (e) => {
            if (this.gameActive && e.pointerType === 'touch') {
                this.jump();
            }
        });
        
        if (this.world) {
            this.world.addEventListener('click', () => {
                if (this.gameActive) this.jump();
            });
        }
    },

    // LÓGICA DO MAPA DA JORNADA
    mapaCurrentStep: 0,
    mapaSteps: [
        { id: 'mapa-m1', name: 'SOLICITAÇÃO DE COMPRA', pos: 8, thought: 'Lá vem a correria de novo!' },
        { id: 'mapa-m2', name: 'COTAÇÃO', pos: 23, thought: '3 fornecedores, 20 e-mails, 10 planilhas... que canseira!' },
        { id: 'mapa-m3', name: 'EQUALIZAÇÃO', pos: 38, thought: 'Comparando tudo manualmente... preço, prazo, quantidade...' },
        { id: 'mapa-m4', name: 'SOLICITAÇÃO DE AJUSTES', pos: 52, thought: 'Tenho que rever tudo e revalidar os orçamentos de novo?' },
        { id: 'mapa-m5', name: 'APROVAÇÃO', pos: 66, thought: 'Vou orar para que aprovem logo!' },
        { id: 'mapa-m6', name: 'ORDEM DE COMPRA', pos: 80, thought: 'Gerei o documento, finalmente!' },
        { id: 'mapa-m7', name: 'ENTREGA', pos: 94, thought: 'Tomara que me entreguem logo!' }
    ],

    initMapa() {
        const player = document.getElementById('mapa-player');
        const isMobile = window.innerWidth < 768;
        if (player) {
            if (isMobile) {
                player.style.top = '8%';
                player.style.left = '45px';
            } else {
                player.style.left = '8%';
                player.style.top = '';
            }
        }
        this.updateMilestones();

        setTimeout(() => {
            const bubble = document.getElementById('mapa-bubble-container');
            const dots = document.getElementById('mapa-dots');
            const text = document.getElementById('mapa-bubble-text');
            if (bubble && dots && text) {
                text.innerText = this.mapaSteps[0].thought;
                bubble.style.display = 'block';
                dots.style.display = 'block';
            }
        }, 300);
    },

    updateMilestones() {
        const isMobile = window.innerWidth < 768;
        this.mapaSteps.forEach((s, i) => {
            const el = document.getElementById(s.id);
            if (el) {
                if (isMobile) {
                    el.style.top = s.pos + '%';
                    el.style.left = '';
                } else {
                    el.style.left = s.pos + '%';
                    el.style.top = '';
                }
                el.style.opacity = i <= this.mapaCurrentStep ? '1' : '0.3';
                const label = el.querySelector('.milestone-box');
                if (label) label.innerText = s.name;
            }
        });
    },

    moveNext() {
        if (this.mapaCurrentStep < this.mapaSteps.length - 1) {
            this.mapaCurrentStep++;
            const player = document.getElementById('mapa-player');
            const bubble = document.getElementById('mapa-bubble-container');
            const dots = document.getElementById('mapa-dots');
            const text = document.getElementById('mapa-bubble-text');
            
            const targetPos = this.mapaSteps[this.mapaCurrentStep].pos;
            const isMobile = window.innerWidth < 768;
            
            if (isMobile) {
                player.style.transition = 'top 1s cubic-bezier(0.4, 0, 0.2, 1)';
                player.style.top = targetPos + '%';
            } else {
                player.style.transition = 'left 1s cubic-bezier(0.4, 0, 0.2, 1)';
                player.style.left = targetPos + '%';
            }
            
            if (bubble && dots && text) {
                text.innerText = this.mapaSteps[this.mapaCurrentStep].thought;
                bubble.style.display = 'block';
                dots.style.display = 'block';
            }
            
            const companyText = document.querySelector('.company-bubble-text');
            if (companyText && this.mapaCurrentStep > 0) {
                companyText.innerText = "Meu Deus que demora, cadê os insumos?";
            }

            this.updateMilestones();
        }
    },

    applySolution() {
        const player = document.getElementById('mapa-player');
        const bubble = document.getElementById('mapa-bubble-container');
        const dots = document.getElementById('mapa-dots');
        const text = document.getElementById('mapa-bubble-text');
        const isMobile = window.innerWidth < 768;
        const path = document.getElementById(isMobile ? 'mapa-jump-path-mobile' : 'mapa-jump-path');
        
        if (path) path.style.display = 'block';
        if (bubble && text) {
            text.innerText = "AGORA SIM! EFICIÊNCIA PURA! 🚀";
            bubble.style.display = 'block';
            dots.style.display = 'block';
        }

        const companyText = document.querySelector('.company-bubble-text');
        if (companyText) {
            companyText.innerText = "Uauuu que rápido!";
        }

        player.classList.add(isMobile ? 'leaping-mobile' : 'leaping');
        
        setTimeout(() => {
            this.mapaCurrentStep = this.mapaSteps.length - 1;
            if (isMobile) {
                player.style.top = '94%';
                player.style.left = '45px';
            } else {
                player.style.left = '94%';
            }
            this.updateMilestones();
            if (bubble && text) {
                text.innerText = "Obrigado Poupe-me! 🚀";
            }
            if (path) path.style.display = 'none';
        }, 2100);
    },

    // LÓGICA DO JOGO DE DIAGNÓSTICO
    startDialogueSequence() {
        this.state = 'dialog';
        this.questionsAnswered = 0;
        this.initialWalk();
    },

    initialWalk() {
        if (!this.wizard) return;
        this.isWalkingToVendor = true;
        this.wizard.classList.add('walking');
        this.dialogBox.style.display = 'none';

        this.currentVendor = document.createElement('div');
        this.currentVendor.className = 'vendor';
        this.currentVendor.style.right = '-200px';
        this.currentVendor.innerHTML = `
            <div class="vendor-logo-container">
                <img src="1-removebg-preview.png" class="vendor-logo" style="width: 85px; margin-bottom: -12px; filter: drop-shadow(0 0 10px rgba(212,175,55,0.5));">
            </div>
            <div class="vendor-stall"></div>
        `;
        this.vendorContainer.appendChild(this.currentVendor);

        let vPos = -200;
        const stopPoint = window.innerWidth < 768 ? 150 : 750;
        const walkInterval = setInterval(() => {
            vPos += 8;
            this.currentVendor.style.right = vPos + 'px';

            if (vPos >= stopPoint) {
                clearInterval(walkInterval);
                this.isWalkingToVendor = false;
                this.wizard.classList.remove('walking');
                this.showCurrentQuestion();
            }
        }, 20);
    },

    showCurrentQuestion() {
        const d = this.dialogs[this.questionsAnswered];
        this.dialogBox.style.display = 'block';
        this.dialogBox.innerHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <img src="Vertical Tijolo.png" style="height: 70px; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));">
            </div>
            <h2 style="font-size: 16px; color: var(--gold); font-family: 'Cinzel', serif; margin-bottom: 8px;">${d.title}</h2>
            <p style="font-size: 13px; margin-bottom: 12px; line-height: 1.4;">${d.text}</p>
            ${d.options.map((o, i) => `
                <button class="option-btn" style="font-size: 12px; padding: 10px; margin-top: 6px;" onclick="CaminhoGame.answerQuestion(${i})">${o.text}</button>
            `).join('')}
        `;
    },

    answerQuestion(idx) {
        const d = this.dialogs[this.questionsAnswered];
        const selectedOption = d.options[idx].text;
        this.userAnswers.push({
            pergunta: d.title,
            resposta: selectedOption
        });
        this.questionsAnswered++;
        if (this.questionsAnswered >= 3) {
            if (this.currentVendor) this.currentVendor.remove();
            this.win();
        } else {
            this.showCurrentQuestion();
        }
    },

    resetRunnerGame() {
        this.gameActive = false;
        cancelAnimationFrame(this.animationId);
        this.obstacles.forEach((obs) => obs.remove());
        this.obstacles = [];
        this.vendors.forEach((v) => v.remove());
        this.vendors = [];
        this.consultationShown = false;
        this.world.querySelector('#caminho-consultancy-box').style.display = 'none';
        document.getElementById('caminho-game-over-screen').style.display = 'none';
        document.getElementById('caminho-adventure-ui').style.display = 'block';
        document.getElementById('caminho-reward-banner').style.display = 'none';
        this.startRunnerGame();
    },

    win() {
        this.state = 'win';
        this.dialogBox.style.display = 'none';
        document.getElementById('caminho-win-screen').style.display = 'flex';
        document.getElementById('caminho-reward-banner').style.display = 'block';
    },

    setupForm() {
        const form = document.getElementById('caminho-lead-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const leadData = {
                    nome: document.getElementById('adv-name').value,
                    telefone: document.getElementById('adv-phone').value,
                    empresa: document.getElementById('adv-company').value,
                    origem: 'Runner Game Win',
                    ...buildRespostasJogoFields()
                };

                dispatchLead(
                    leadData,
                    () => {
                        document.getElementById('caminho-win-screen').style.display = 'none';
                        this.startRunnerGame();
                    },
                    form
                );
            };
        }
    },

    startRunnerGame() {
        this.state = 'adventure';
        this.runnerMode = true;
        document.getElementById('caminho-adventure-ui').style.display = 'block';
        document.getElementById('caminho-reward-banner').style.display = 'none';
        const rewardIcon = document.querySelector('.win-card.reward-card .reward-icon');
        if (rewardIcon) rewardIcon.style.display = 'none';
        this.gameActive = true;
        this.score = 0;
        this.totalJumps = 0;
        this.speed = this.baseRunSpeed;
        this.obstacles = [];
        this.vendors = [];
        this.consultationUnlocked = false;
        this.consultationShown = false;
        const consultancyBox = this.world.querySelector('#caminho-consultancy-box');
        if (consultancyBox) consultancyBox.style.display = 'none';
        this.spawnObstacle();
        this.gameLoop();
    },

    jump() {
        if (this.isJumping || !this.gameActive) return;
        this.totalJumps++;
        this.isJumping = true;
        this.wizard.classList.add('walking');
        
        let pos = 30;
        const jumpInterval = setInterval(() => {
            if (pos >= 200) {
                clearInterval(jumpInterval);
                const fallInterval = setInterval(() => {
                    if (pos <= 30) {
                        clearInterval(fallInterval);
                        this.isJumping = false;
                    }
                    pos -= 5;
                    this.wizard.style.bottom = pos + 'px';
                }, 20);
            }
            pos += 8;
            this.wizard.style.bottom = pos + 'px';
        }, 20);
    },

    /** 80+ pts: fica mais rápido; a cada 20 (100, 120…) acelera outra vez (até um limite). */
    updateRunSpeedForScore() {
        if (this.score < 80) {
            this.speed = this.baseRunSpeed;
            return;
        }
        const tier = Math.floor((this.score - 80) / 20);
        const step = 0.65;
        const maxExtra = 4.5;
        const extra = Math.min((tier + 1) * step, maxExtra);
        this.speed = this.baseRunSpeed + extra;
    },

    getNextObstacleDelay() {
        const isMobile = window.innerWidth < 768;
        const jumps = Math.min(this.totalJumps || 0, 9);
        const minD = isMobile ? 2400 : 1900;
        const base = isMobile ? 5000 : 3900;
        const ramp = jumps * (isMobile ? 210 : 185);
        const jitter = (isMobile ? 2400 : 1900) * Math.random();
        return Math.max(minD, base - ramp + jitter * 0.5);
    },

    spawnObstacle() {
        if (!this.gameActive) return;
        const obs = document.createElement('div');
        obs.className = 'obstacle';
        obs.style.right = '-50px';
        this.world.appendChild(obs);
        this.obstacles.push(obs);
        setTimeout(() => this.spawnObstacle(), this.getNextObstacleDelay());
    },

    spawnVendor() {
        if (!this.gameActive) return;
        const v = document.createElement('div');
        v.className = 'vendor';
        v.style.right = '-150px';
        v.innerHTML = `
            <div class="vendor-logo-container">
                <img src="1-removebg-preview.png" class="vendor-logo" style="width: 70px; margin-bottom: -15px;">
            </div>
            <div class="vendor-stall"></div>
        `;
        this.vendorContainer.appendChild(v);
        this.vendors.push(v);
        setTimeout(() => this.spawnVendor(), 5000 + Math.random() * 3000);
    },

    gameLoop() {
        if (!this.gameActive) return;
        
        this.obstacles.forEach((obs, index) => {
            let right = parseInt(obs.style.right);
            right += this.speed;
            obs.style.right = right + 'px';
            
            const wizardRect = this.wizard.getBoundingClientRect();
            const obsRect = obs.getBoundingClientRect();
            
            if (wizardRect.right > obsRect.left + 15 && wizardRect.left < obsRect.right - 15 && wizardRect.bottom > obsRect.top + 15) {
                this.gameOver();
            }
            
            if (right > 1200) {
                obs.remove();
                this.obstacles.splice(index, 1);
                this.score += 10;
                document.getElementById('caminho-total-points').innerText = this.score;
                this.updateRunSpeedForScore();
                if (this.score >= 50 && !this.consultationShown) {
                    this.consultationUnlocked = true;
                    this.consultationShown = true;
                    this.showConsultationNotification();
                }
            }
        });
        
        this.vendors.forEach((v, index) => {
            let right = parseInt(v.style.right);
            right += this.speed;
            v.style.right = right + 'px';
            if (right > 1200) {
                v.remove();
                this.vendors.splice(index, 1);
            }
        });
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },

    showConsultationNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--gold), #ffeb99); color: #000; padding: 16px 30px; border-radius: 10px; font-weight: 900; z-index: 5000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-size: 14px; text-align: center; max-width: 90%;';
        notification.innerText = '🎉 CONSULTORIA DESBLOQUEADA! Continue jogando!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    gameOver() {
        this.gameActive = false;
        cancelAnimationFrame(this.animationId);
        document.getElementById('caminho-game-over-screen').style.display = 'flex';
        document.getElementById('caminho-high-score').innerText = this.score;
    },
    
    restart() {
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    applyFormSubmitActionToLeadForms();
    CaminhoGame.init();
});

function moveNext() { CaminhoGame.moveNext(); }
function applySolution() { CaminhoGame.applySolution(); }
function restartCaminhoRun() { CaminhoGame.resetRunnerGame(); }
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.style.display = 'none';
}
function closeDirectLeadForm() {
    const modal = document.getElementById('direct-lead-modal');
    if (modal) modal.style.display = 'none';
}
function openDirectLeadForm() {
    const modal = document.getElementById('direct-lead-modal');
    if (modal) modal.style.display = 'flex';
}

/** Nome, telefone e empresa vêm do formulário; as 3 respostas do diagnóstico no array, no texto agrupado e em campos separados. */
function buildRespostasJogoFields() {
    const answers = typeof CaminhoGame !== 'undefined' && Array.isArray(CaminhoGame.userAnswers)
        ? CaminhoGame.userAnswers
        : [];
    const respostas_jogo_agrupadas = answers.length
        ? answers.map((a) => `${a.pergunta}: ${a.resposta}`).join(' | ')
        : '';
    return {
        respostas_diagnostico: answers,
        respostas_jogo_agrupadas,
        pergunta_1: answers[0]?.pergunta || '',
        resposta_1: answers[0]?.resposta || '',
        pergunta_2: answers[1]?.pergunta || '',
        resposta_2: answers[1]?.resposta || '',
        pergunta_3: answers[2]?.pergunta || '',
        resposta_3: answers[2]?.resposta || ''
    };
}

/** URL do FormSubmit: <body> data-formsubmit → SITE_CONFIG.formSubmitFullUrl → SITE_CONFIG.formSubmitEmail → data-formsubmit-email. */
function getFormSubmitUrl() {
    const full = typeof document !== 'undefined' && document.body
        ? document.body.getAttribute('data-formsubmit')
        : '';
    const fullTrim = full && String(full).trim();
    if (fullTrim && fullTrim.startsWith('http')) return fullTrim;
    const cfgFull = SITE_CONFIG.formSubmitFullUrl && String(SITE_CONFIG.formSubmitFullUrl).trim();
    if (cfgFull && cfgFull.startsWith('http')) return cfgFull;
    const cfgEm = SITE_CONFIG.formSubmitEmail && String(SITE_CONFIG.formSubmitEmail).trim();
    if (cfgEm && cfgEm.includes('@')) return 'https://formsubmit.co/' + cfgEm;
    const email =
        typeof document !== 'undefined' && document.body
            ? document.body.getAttribute('data-formsubmit-email')
            : '';
    const em = email && String(email).trim();
    if (em && em.includes('@')) return 'https://formsubmit.co/' + em;
    return '';
}

function applyFormSubmitActionToLeadForms() {
    const url = getFormSubmitUrl();
    document.querySelectorAll('form.lead-form-submit').forEach((f) => {
        if (url) f.setAttribute('action', url);
        else f.removeAttribute('action');
    });
}

function fillLeadFormHiddens(form, leadData) {
    if (!form || !leadData) return;
    const set = (name, val) => {
        const el = form.elements.namedItem(name);
        if (el && 'value' in el) el.value = val == null ? '' : String(val);
    };
    set('origem', leadData.origem);
    set('respostas_jogo_agrupadas', leadData.respostas_jogo_agrupadas);
    set('pergunta_1', leadData.pergunta_1);
    set('resposta_1', leadData.resposta_1);
    set('pergunta_2', leadData.pergunta_2);
    set('resposta_2', leadData.resposta_2);
    set('pergunta_3', leadData.pergunta_3);
    set('resposta_3', leadData.resposta_3);
    set('respostas_diagnostico_json', JSON.stringify(leadData.respostas_diagnostico || []));
    set('_subject', 'Lead Poupe-me — ' + (leadData.origem || 'site'));
}

function postLeadToMake(leadData) {
    return fetch(SITE_CONFIG.makeWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
    });
}

/** Envia o mesmo payload do formulário HTML (action + name), como no guia do FormSubmit. */
function postFormToFormSubmit(formEl) {
    const url = formEl?.getAttribute('action');
    if (!url || !url.startsWith('http')) return Promise.resolve();

    const fd = new FormData(formEl);
    const p = new URLSearchParams();
    fd.forEach((v, k) => {
        p.append(k, typeof v === 'string' ? v : String(v));
    });

    return fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: p.toString()
    });
}

/** Fallback sem elemento form (mesmos nomes de campo). */
function postLeadToFormSubmitFromData(leadData) {
    const url = getFormSubmitUrl();
    if (!url) return Promise.resolve();

    const p = new URLSearchParams();
    p.set('nome', leadData.nome || '');
    p.set('telefone', leadData.telefone || '');
    p.set('empresa', leadData.empresa || '');
    p.set('origem', leadData.origem || '');
    p.set('respostas_jogo_agrupadas', leadData.respostas_jogo_agrupadas || '');
    p.set('pergunta_1', leadData.pergunta_1 || '');
    p.set('resposta_1', leadData.resposta_1 || '');
    p.set('pergunta_2', leadData.pergunta_2 || '');
    p.set('resposta_2', leadData.resposta_2 || '');
    p.set('pergunta_3', leadData.pergunta_3 || '');
    p.set('resposta_3', leadData.resposta_3 || '');
    p.set('respostas_diagnostico_json', JSON.stringify(leadData.respostas_diagnostico || []));
    p.set('_subject', `Lead Poupe-me — ${leadData.origem || 'site'}`);
    p.set('_captcha', 'false');

    return fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: p.toString()
    });
}

function dispatchLead(leadData, onFinally, formEl) {
    if (formEl) fillLeadFormHiddens(formEl, leadData);

    const promises = [postLeadToMake(leadData)];
    if (formEl && formEl.getAttribute('action')?.startsWith('http')) {
        promises.push(postFormToFormSubmit(formEl));
    } else if (!formEl && getFormSubmitUrl()) {
        promises.push(postLeadToFormSubmitFromData(leadData));
    }

    Promise.allSettled(promises).finally(() => {
        if (typeof onFinally === 'function') onFinally();
    });
}

function handleDirectLead(event, formType = 'direct') {
    event.preventDefault();
    const form = event.target;
    const isFinal = formType === 'final';
    const name = document.getElementById(isFinal ? 'final-name' : 'direct-name')?.value || '';
    const phone = document.getElementById(isFinal ? 'final-phone' : 'direct-phone')?.value || '';
    const company = document.getElementById(isFinal ? 'final-company' : 'direct-company')?.value || '';
    const leadData = {
        nome: name,
        telefone: phone,
        empresa: company,
        origem: isFinal ? 'Final Form' : 'Direct Form',
        ...buildRespostasJogoFields()
    };

    dispatchLead(
        leadData,
        () => {
            closeDirectLeadForm();
            const successModal = document.getElementById('success-modal');
            if (successModal) successModal.style.display = 'flex';
        },
        form
    );
}
function requestConsultancy() { openDirectLeadForm(); }
function exportLeadsReport() { alert('Acesso restrito.'); }
function resetCaminhoGame() { CaminhoGame.resetRunnerGame(); }