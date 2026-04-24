
const SITE_CONFIG = {
    makeWebhookUrl: 'https://hook.us1.make.com/6v30h5vujr9vlygexndx77q2fujv7f7v',
    formSubmitEmail: 'felipe008lucas@gmail.com',
    formSubmitFullUrl: 'https://formsubmit.co/felipe008lucas@gmail.com'
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
    currentQuestionSelections: [],
    diagnosticoDoneKey: 'poupeme_diagnostico_done_v1',
    
    dialogs: [
        {
            title: "PERFIL DE COMPRAS",
            text: "Os materiais de limpeza, papelaria, copa e descartáveis são comprados via?",
            allowMultiple: false,
            options: [
                { text: "Cotações abertas de forma recorrente" },
                { text: "Comodato" },
                { text: "Contrato com preços fixos" }
            ]
        },
        {
            title: "ESSENCIAL",
            text: "Qual dessas 4 opções é a base da sua estratégia de compras desses insumos?",
            allowMultiple: false,
            options: [
                { text: "Menor preço" },
                { text: "Produtos de qualidade" },
                { text: "Entrega rápida" },
                { text: "Desenvolvimento de parceria" }
            ]
        },
        {
            title: "DESAFIOS",
            text: "O que é mais desafiador na sua operação de compras hoje?",
            allowMultiple: false,
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

        // Espaço / seta pra cima no PC
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.gameActive) {
                e.preventDefault();
                this.jump();
            }
        });

        // Botão de pular — registra aqui para garantir funcionamento
        const jumpBtn = document.getElementById('jump-btn');
        const gameWrapper = document.getElementById('caminho-game-wrapper');
        if (jumpBtn) {
            const doJump = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (CaminhoGame.gameActive) {
                    CaminhoGame.jump();
                    // Feedback visual
                    jumpBtn.style.transform = 'scale(0.9)';
                    setTimeout(() => jumpBtn.style.transform = 'scale(1)', 100);
                }
            };
            // Eventos de toque (mobile)
            jumpBtn.addEventListener('touchstart', doJump, { passive: false });
            jumpBtn.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
            // Eventos de mouse (desktop)
            jumpBtn.addEventListener('mousedown', doJump);
            jumpBtn.addEventListener('mouseup', (e) => e.preventDefault());
            jumpBtn.addEventListener('click', doJump);
            // Eventos de ponteiro (compatibilidade)
            jumpBtn.addEventListener('pointerdown', doJump, { passive: false });
            jumpBtn.addEventListener('pointerup', (e) => e.preventDefault(), { passive: false });
        }
        if (gameWrapper) {
            // Fallback: no mobile, tocar na área do jogo também executa pulo.
            const wrapperJump = (e) => {
                if (!CaminhoGame.gameActive) return;
                if (e.target && e.target.closest('input, textarea, select, button, a, form, label')) return;
                e.preventDefault();
                CaminhoGame.jump();
            };
            gameWrapper.addEventListener('touchstart', wrapperJump, { passive: false });
            gameWrapper.addEventListener('pointerdown', wrapperJump, { passive: false });
        }
    },

    // LÓGICA DO MAPA DA JORNADA
    mapaCurrentStep: 0,
    mapaMobileJumpRaf: null,
    mapaSteps: [
        { id: 'mapa-m1', name: 'SOLICITAÇÃO DE COMPRA', pos: 8, thought: 'Lá vem a correria de novo!' },
        { id: 'mapa-m2', name: 'COTAÇÃO', pos: 23, thought: '3 fornecedores, 20 e-mails, 10 planilhas... que canseira!' },
        { id: 'mapa-m3', name: 'EQUALIZAÇÃO', pos: 38, thought: 'Comparando tudo manualmente... preço, prazo, quantidade...' },
        { id: 'mapa-m4', name: 'SOLICITAÇÃO DE AJUSTES', pos: 52, thought: 'Tenho que rever tudo e revalidar os orçamentos de novo?' },
        { id: 'mapa-m5', name: 'APROVAÇÃO', pos: 66, thought: 'Vou orar para que aprovem logo!' },
        { id: 'mapa-m6', name: 'ORDEM DE COMPRA', pos: 80, thought: 'Gerei o documento, finalmente!' },
        { id: 'mapa-m7', name: 'ENTREGA', pos: 94, thought: 'Tomara que me entreguem logo!' }
    ],

    setMapaPlayerPositionMobile(player, leftValue, topValue) {
        if (!player) return;
        player.style.setProperty('left', leftValue, 'important');
        player.style.setProperty('top', topValue);
    },

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
                bubble.style.height = 'auto';
                bubble.style.minHeight = '100px';
                dots.style.display = 'block';
                text.style.display = 'block';
                text.style.visibility = 'visible';
                // Na primeira etapa, nuvem para baixo
                bubble.style.bottom = 'auto';
                bubble.style.top = '110%';
                dots.style.bottom = 'auto';
                dots.style.top = '95%';
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
                bubble.style.height = 'auto';
                bubble.style.minHeight = '100px';
                dots.style.display = 'block';
                text.style.display = 'block';
                text.style.visibility = 'visible';
                // Se voltou para a primeira etapa, nuvem para baixo; senão, original
                if (this.mapaCurrentStep === 0) {
                    bubble.style.bottom = 'auto';
                    bubble.style.top = '110%';
                    dots.style.bottom = 'auto';
                    dots.style.top = '95%';
                } else {
                    bubble.style.top = 'auto';
                    bubble.style.bottom = '110%';
                    dots.style.top = 'auto';
                    dots.style.bottom = '95%';
                }
            }
            
            const companyText = document.querySelector('.company-bubble-text');
            if (companyText && this.mapaCurrentStep > 0) {
                companyText.innerText = "Meu Deus que demora, cadê os insumos?";
            }
            
            this.updateMilestones();
            
            // Se chegou na última etapa (ENTREGA), mostrar mensagem e botão
            if (this.mapaCurrentStep === this.mapaSteps.length - 1) {
                setTimeout(() => {
                    this.showCompletionNotificationOnDelivery();
                }, 1200);
            }
        }
    },

    // Função auxiliar para remover notificação quando clica no botão
    removeCompletionNotification() {
        const notification = document.querySelector('div[data-completion-notification]');
        if (notification) notification.remove();
    },

    applySolution() {
        const player = document.getElementById('mapa-player');
        const bubble = document.getElementById('mapa-bubble-container');
        const dots = document.getElementById('mapa-dots');
        const text = document.getElementById('mapa-bubble-text');
        const isMobile = window.innerWidth < 768;
        const path = document.getElementById(isMobile ? 'mapa-jump-path-mobile' : 'mapa-jump-path');
        
        // RESETAR para stage 0 (início)
        if (isMobile) {
            if (this.mapaMobileJumpRaf) {
                cancelAnimationFrame(this.mapaMobileJumpRaf);
                this.mapaMobileJumpRaf = null;
            }
            player.classList.remove('leaping-mobile');
            player.style.transition = 'top 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
            this.setMapaPlayerPositionMobile(player, '45px', this.mapaSteps[0].pos + '%');
        } else {
            player.style.left = '8%';
        }
        
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

        if (!isMobile) {
            player.classList.add('leaping');
        }
        
        // Remover a notificação anterior quando clica no botão
        const oldNotification = document.querySelector('div[data-completion-notification]');
        if (oldNotification) oldNotification.remove();
        
        const finishSolution = () => {
            this.mapaCurrentStep = this.mapaSteps.length - 1;
            if (isMobile) {
                player.style.transition = 'none';
            } else {
                player.style.left = '94%';
            }
            this.updateMilestones();
            if (bubble && text) {
                text.innerText = "Obrigado Poupe-me! 🚀";
            }
            if (path) path.style.display = 'none';
            // Mostrar notificação final
            CaminhoGame.showFinalMessage();
        };

        if (isMobile) {
            setTimeout(() => {
                this.animateMobileSolutionJump(player, finishSolution);
            }, 380);
        } else {
            setTimeout(finishSolution, 2100);
        }
    },

    animateMobileSolutionJump(player, onComplete) {
        const jumpSvg = document.getElementById('mapa-jump-path-mobile');
        const jumpCurve = jumpSvg ? jumpSvg.querySelector('.dash-line') : null;

        if (!jumpSvg || !jumpCurve) {
            onComplete();
            return;
        }

        const duration = 1800;
        const startTime = performance.now();
        const pathLength = jumpCurve.getTotalLength();
        const viewBox = jumpSvg.viewBox && jumpSvg.viewBox.baseVal
            ? jumpSvg.viewBox.baseVal
            : { x: 0, y: 0, width: 400, height: 1000 };

        if (!viewBox.width || !viewBox.height) {
            onComplete();
            return;
        }

        const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

        const step = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const easedT = easeInOut(t);
            const point = jumpCurve.getPointAtLength(pathLength * easedT);

            // Seguir exatamente o path pontilhado em coordenadas relativas.
            const xPct = ((point.x - viewBox.x) / viewBox.width) * 100;
            const yPct = ((point.y - viewBox.y) / viewBox.height) * 100;

            player.style.transition = 'none';
            this.setMapaPlayerPositionMobile(player, `${xPct}%`, `${yPct}%`);

            if (t < 1) {
                this.mapaMobileJumpRaf = requestAnimationFrame(step);
            } else {
                this.mapaMobileJumpRaf = null;
                onComplete();
            }
        };

        this.mapaMobileJumpRaf = requestAnimationFrame(step);
    },

    showCompletionNotificationOnDelivery() {
        const solutionBtn = document.getElementById('mapa-solution-btn');
        const notification = document.createElement('div');
        notification.setAttribute('data-completion-notification', 'true');
        const isMobile = window.innerWidth < 768;
        const maxWidth = isMobile ? '92vw' : '85%';
        const padding = isMobile ? '14px 16px' : '30px 40px';
        const fontSize = isMobile ? '14px' : '16px';

        notification.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, var(--gold), #ffeb99); color: #000; padding: ${padding}; border-radius: 14px; font-weight: 900; z-index: 6000; box-shadow: 0 15px 40px rgba(0,0,0,0.6); font-size: ${fontSize}; text-align: center; width: min(${maxWidth}, 460px);`;
        notification.innerHTML = `<p style="margin: 0; font-size: ${isMobile ? '15px' : '18px'}; line-height: 1.35; font-weight: bold;">Demorado né?<br>O Poupe-me pode ajudar agora<br>deixe com a gente!<br><br>Clique no botão abaixo</p>`;
        document.body.appendChild(notification);
        
        // Mostrar botão SOLUÇÃO POUPE-ME
        if (solutionBtn) {
            solutionBtn.style.display = 'block';
        }
    },

    showFinalMessage() {
        const oldFinal = document.querySelector('div[data-final-notification]');
        if (oldFinal) oldFinal.remove();

        const mapWrapper = document.getElementById('mapa-game-wrapper');
        if (!mapWrapper) return;

        const notification = document.createElement('div');
        notification.setAttribute('data-final-notification', 'true');
        const isMobile = window.innerWidth < 768;
        const maxWidth = isMobile ? '94%' : '85%';
        const padding = isMobile ? '14px 16px' : '30px 40px';
        const fontSize = isMobile ? '14px' : '16px';
        notification.style.cssText = `position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); background: linear-gradient(135deg, var(--gold), #ffeb99); color: #000; padding: ${padding}; border-radius: 14px; font-weight: 900; z-index: 4500; box-shadow: 0 15px 40px rgba(0,0,0,0.6); font-size: ${fontSize}; text-align: center; width: min(${maxWidth}, 460px); pointer-events: all;`;
        notification.innerHTML = `<p style="margin: 0; font-size: ${isMobile ? '15px' : '18px'}; line-height: 1.35; font-weight: bold;">Agora você tem tempo para fazer o que realmente importa e é estratégico.<br><br>O restante deixa com o Poupe-me!</p><button type="button" onclick="CaminhoGame.replayMapaProcess()" style="margin-top: 12px; padding: 9px 14px; background: #111; color: #fff; border: 1px solid #fff; border-radius: 8px; font-weight: 800; cursor: pointer;">VER PROCESSO DE NOVO</button>`;
        mapWrapper.appendChild(notification);
    },

    replayMapaProcess() {
        const player = document.getElementById('mapa-player');
        const bubble = document.getElementById('mapa-bubble-container');
        const dots = document.getElementById('mapa-dots');
        const text = document.getElementById('mapa-bubble-text');
        const isMobile = window.innerWidth < 768;
        const pathDesktop = document.getElementById('mapa-jump-path');
        const pathMobile = document.getElementById('mapa-jump-path-mobile');
        const finalNotification = document.querySelector('div[data-final-notification]');
        if (finalNotification) finalNotification.remove();

        this.mapaCurrentStep = 0;
        if (player) {
            player.classList.remove('leaping', 'leaping-mobile');
            player.style.transition = isMobile
                ? 'top 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            if (isMobile) {
                this.setMapaPlayerPositionMobile(player, '45px', this.mapaSteps[0].pos + '%');
            } else {
                player.style.left = this.mapaSteps[0].pos + '%';
            }
        }
        if (bubble && dots && text) {
            text.innerText = this.mapaSteps[0].thought;
            bubble.style.display = 'block';
            dots.style.display = 'block';
            bubble.style.bottom = 'auto';
            bubble.style.top = '110%';
            dots.style.bottom = 'auto';
            dots.style.top = '95%';
        }
        if (pathDesktop) pathDesktop.style.display = 'none';
        if (pathMobile) pathMobile.style.display = 'none';
        this.updateMilestones();

        const companyText = document.querySelector('.company-bubble-text');
        if (companyText) companyText.innerText = 'Acabaram os insumos!';
    },

    // LÓGICA DO JOGO DE DIAGNÓSTICO

    startDialogueSequence() {
        if (this.hasCompletedDiagnostico()) {
            this.startRunnerGame();
            return;
        }
        this.state = 'dialog';
        this.questionsAnswered = 0;
        this.initialWalk();
    },

    hasCompletedDiagnostico() {
        try {
            return localStorage.getItem(this.diagnosticoDoneKey) === '1';
        } catch (_) {
            return false;
        }
    },

    markDiagnosticoCompleted() {
        try {
            localStorage.setItem(this.diagnosticoDoneKey, '1');
        } catch (_) {
            // Se localStorage não estiver disponível, segue fluxo normal sem quebrar.
        }
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
        this.currentQuestionSelections = [];
        const optionsHtml = d.options.map((o, i) => `
                <button class="option-btn" data-option-index="${i}" style="font-size: 12px; padding: 10px; margin-top: 6px;" onclick="CaminhoGame.answerQuestion(${i})">${o.text}</button>
            `).join('');
        this.dialogBox.style.display = 'block';
        this.dialogBox.innerHTML = `
            <div style="text-align: center; margin-bottom: 12px;">
                <img src="Vertical Tijolo.png" style="height: 70px; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));">
            </div>
            <h2 style="font-size: 16px; color: var(--gold); font-family: 'Cinzel', serif; margin-bottom: 8px;">${d.title}</h2>
            <p style="font-size: 13px; margin-bottom: 12px; line-height: 1.4;">${d.text}</p>
            ${d.allowMultiple ? '<p style="font-size: 11px; color: #ffd700; margin: 4px 0 8px;">Escolha duas opções.</p>' : ''}
            ${optionsHtml}
        `;
        if (d.allowMultiple) {
            this.dialogBox.querySelectorAll('[data-option-index]').forEach((btn) => {
                btn.setAttribute('onclick', `CaminhoGame.toggleOptionSelection(${btn.getAttribute('data-option-index')})`);
            });
        }
    },

    answerQuestion(idx) {
        const d = this.dialogs[this.questionsAnswered];
        if (d.allowMultiple) {
            this.toggleOptionSelection(idx);
            return;
        }
        const selectedOption = d.options[idx].text;
        this.userAnswers.push({
            pergunta: d.title,
            resposta: selectedOption
        });
        this.questionsAnswered++;
        if (this.questionsAnswered >= 3) {
            this.markDiagnosticoCompleted();
            if (this.currentVendor) this.currentVendor.remove();
            this.win();
        } else {
            this.showCurrentQuestion();
        }
    },

    toggleOptionSelection(idx) {
        const d = this.dialogs[this.questionsAnswered];
        if (!d || !d.allowMultiple) return;
        const maxSelections = d.maxSelections || 2;

        if (this.currentQuestionSelections.includes(idx)) {
            this.currentQuestionSelections = this.currentQuestionSelections.filter((i) => i !== idx);
        } else {
            if (this.currentQuestionSelections.length >= maxSelections) {
                alert(`Você pode escolher no máximo ${maxSelections} opções.`);
                return;
            }
            this.currentQuestionSelections.push(idx);
        }

        this.dialogBox.querySelectorAll('[data-option-index]').forEach((btn) => {
            const optIndex = Number(btn.getAttribute('data-option-index'));
            const selected = this.currentQuestionSelections.includes(optIndex);
            btn.style.background = selected ? 'var(--gold)' : '';
            btn.style.color = selected ? '#000' : '';
            btn.style.border = selected ? '2px solid #fff' : '';
        });
        if (this.currentQuestionSelections.length === maxSelections) {
            this.confirmMultiAnswer();
        }
    },

    confirmMultiAnswer() {
        const d = this.dialogs[this.questionsAnswered];
        if (!d || !d.allowMultiple) return;
        if (!this.currentQuestionSelections.length) {
            alert('Selecione pelo menos uma opção.');
            return;
        }
        const selectedTexts = this.currentQuestionSelections
            .map((idx) => d.options[idx]?.text)
            .filter(Boolean);
        this.userAnswers.push({
            pergunta: d.title,
            resposta: selectedTexts.join(' | ')
        });
        this.questionsAnswered++;
        if (this.questionsAnswered >= 3) {
            this.markDiagnosticoCompleted();
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
                const name = document.getElementById('adv-name').value || '';
                const phone = document.getElementById('adv-phone').value || '';
                const email = document.getElementById('adv-email')?.value || '';
                const company = document.getElementById('adv-company').value || '';

                const leadValidation = validateLeadFields({ name, phone, company, email });
                if (!leadValidation.valid) {
                    alert(leadValidation.error);
                    return;
                }

                const leadData = {
                    nome: name.trim(),
                    telefone: phone.replace(/\D/g, ''),
                    email: email.trim(),
                    empresa: company.trim(),
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
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn) jumpBtn.style.display = 'block';
        // Esconde o botão quando sair da seção do jogo
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                const btn = document.getElementById('jump-btn');
                if (btn) btn.style.display = e.isIntersecting && CaminhoGame.gameActive ? 'block' : 'none';
            });
        }, { threshold: 0.3 });
        const jogoSection = document.getElementById('jogo');
        if (jogoSection) observer.observe(jogoSection);
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
                    this.wizard.style.setProperty('bottom', pos + 'px', 'important');
                }, 20);
            }
            pos += 8;
            this.wizard.style.setProperty('bottom', pos + 'px', 'important');
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
        const isMobile = window.innerWidth < 768;
        notification.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, var(--gold), #ffeb99); color: #000; padding: ${isMobile ? '14px 16px' : '30px 40px'}; border-radius: 14px; font-weight: 900; z-index: 5000; box-shadow: 0 15px 40px rgba(0,0,0,0.6); font-size: ${isMobile ? '14px' : '15px'}; text-align: center; width: min(${isMobile ? '92vw' : '85%'}, 460px); line-height: 1.35;`;
        notification.innerHTML = '<p style="margin: 10px 0; font-size: 18px;">🎉 Parabéns!</p><p style="margin: 10px 0;">Você ganhou uma <strong>CONSULTORIA GRATUITA</strong>!</p><p style="margin: 15px 0; font-size: 14px;">Logo nossos consultores irão entrar em contato com você ou nos chame no WhatsApp.</p><p style="margin: 15px 0; font-size: 14px; font-style: italic;">Agora o comprador é liberado pra você se divertir e bater seu record! 🚀</p>';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    },

    closeDifficultyModal() {
        document.getElementById('caminho-difficulty-modal').style.display = 'none';
    },

    gameOver() {
        this.gameActive = false;
        cancelAnimationFrame(this.animationId);
        document.getElementById('caminho-high-score').innerText = this.score;
        const jumpBtn = document.getElementById('jump-btn');
        if (jumpBtn) jumpBtn.style.display = 'none';
        
        // Se bateu e atingiu 50+ pontos, mostrar mensagem de consultoria
        if (this.score >= 50) {
            this.showGameOverWithConsultationMessage();
        } else {
            // Senão, mostrar tela de game over original
            document.getElementById('caminho-game-over-screen').style.display = 'flex';
        }
    },

    showGameOverWithConsultationMessage() {
        const old = this.world ? this.world.querySelector('[data-gameover-consultation]') : null;
        if (old) old.remove();

        const notification = document.createElement('div');
        notification.setAttribute('data-gameover-consultation', 'true');
        const isMobile = window.innerWidth < 768;
        notification.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, var(--gold), #ffeb99); color: #000; padding: ${isMobile ? '14px 16px' : '30px 40px'}; border-radius: 14px; font-weight: 900; z-index: 5000; box-shadow: 0 15px 40px rgba(0,0,0,0.6); font-size: ${isMobile ? '14px' : '15px'}; text-align: center; width: min(${isMobile ? '92%' : '85%'}, 460px); line-height: 1.35;`;
        notification.innerHTML = '<p style="margin: 10px 0; font-size: 18px;">🎉 Parabéns!</p><p style="margin: 10px 0;">Você ganhou uma <strong>CONSULTORIA GRATUITA</strong>!</p><p style="margin: 15px 0; font-size: 14px;">Logo nossos consultores irão entrar em contato com você ou nos chame no WhatsApp.</p><p style="margin: 15px 0; font-size: 14px; font-style: italic;">Agora o comprador é liberado pra você se divertir e bater seu record! 🚀</p><div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top: 20px;"><button onclick="this.closest(\'[data-gameover-consultation]\').remove(); restartCaminhoRun();" style="padding: 10px 20px; background: #d4af37; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">JOGAR DE NOVO</button><button onclick="document.getElementById(\'video-apresentacao\')?.scrollIntoView({ behavior: \'smooth\', block: \'start\' });" style="padding: 10px 20px; background: #111; color: #fff; border: 1px solid #fff; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">IR PARA O VÍDEO</button></div>';
        if (this.world) this.world.appendChild(notification);
    },
    
    restart() {
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    applyFormSubmitActionToLeadForms();
    CaminhoGame.init();
    setupPresentationVideo();
    setupMobileKeyboardFieldVisibility();
});

function setupPresentationVideo() {
    const video = document.getElementById('apresentacao-video');
    const startBtn = document.getElementById('video-start-btn');
    if (!video) return;

    let activatedWithSound = false;
    video.muted = true;
    video.loop = true;
    video.setAttribute('muted', 'muted');
    video.setAttribute('playsinline', 'playsinline');

    const tryAutoplay = () => {
        video.play().catch(() => {
            // Alguns navegadores bloqueiam autoplay até interação do usuário.
        });
    };

    const enableSoundFromStart = () => {
        if (activatedWithSound) return;
        activatedWithSound = true;
        video.currentTime = 0;
        video.loop = false;
        video.muted = false;
        video.volume = 1;
        if (startBtn) startBtn.style.display = 'none';
        video.play().catch(() => {
            // Se bloquear novamente, mantém a tentativa sem quebrar o fluxo.
        });
    };

    if (startBtn) startBtn.addEventListener('click', enableSoundFromStart);
    video.addEventListener('loadedmetadata', tryAutoplay, { once: true });
    tryAutoplay();
}

function setupMobileKeyboardFieldVisibility() {
    const isMobileViewport = () => window.innerWidth <= 768;
    const isTextField = (el) => {
        if (!el) return false;
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    };

    const ensureVisible = (el) => {
        if (!isMobileViewport() || !isTextField(el)) return;
        // Pequeno delay para aguardar o teclado reposicionar o viewport.
        setTimeout(() => {
            try {
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } catch (_) {
                el.scrollIntoView();
            }
        }, 280);
    };

    document.addEventListener('focusin', (e) => {
        ensureVisible(e.target);
    });
}

function triggerJumpButton(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!CaminhoGame || !CaminhoGame.gameActive) return false;

    CaminhoGame.jump();
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
        jumpBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            jumpBtn.style.transform = 'scale(1)';
        }, 100);
    }
    return false;
}

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
    const respostas_diagnostico_detalhadas = answers.length
        ? answers.map((a, i) => `${i + 1}. ${a.pergunta}: ${a.resposta}`).join('\n')
        : '';
    return {
        respostas_diagnostico: answers,
        respostas_jogo_agrupadas,
        respostas_diagnostico_detalhadas,
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
    set('respostas_diagnostico_detalhadas', leadData.respostas_diagnostico_detalhadas || '');
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
    p.set('respostas_diagnostico_detalhadas', leadData.respostas_diagnostico_detalhadas || '');
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

/**
 * Validações de Formulário - Padrões Brasileiros
 */
function validateFullName(name) {
    const trimmedName = name.trim();
    if (trimmedName.length < 6) {
        return { valid: false, error: 'Digite nome e sobrenome completos (mínimo 6 caracteres).' };
    }
    if (trimmedName.length > 120) {
        return { valid: false, error: 'Nome muito longo. Use até 120 caracteres.' };
    }
    // Deve ter pelo menos 2 palavras separadas por espaço
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length < 2) {
        return { valid: false, error: 'Digite nome e sobrenome (ex: Carlos Sousa).' };
    }
    if (nameParts.some((part) => part.length < 2)) {
        return { valid: false, error: 'Nome e sobrenome devem ter ao menos 2 letras cada.' };
    }
    // Verifica se contém apenas letras e espaços (permite acentuação)
    if (!/^[a-záéíóúâêãõçñ'-\s]+$/i.test(trimmedName)) {
        return { valid: false, error: 'O nome deve conter apenas letras e espaços' };
    }
    return { valid: true };
}

function validatePhoneBR(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    // Padrão celular BR: DD9XXXXXXXX (11 dígitos). Ex.: 41991665981
    if (cleanPhone.length !== 11) {
        return { valid: false, error: 'Telefone inválido. Digite 11 números no formato 41991665981.' };
    }
    if (!/^\d{11}$/.test(cleanPhone)) {
        return { valid: false, error: 'Telefone inválido. Use apenas números (sem letras).' };
    }
    const ddd = cleanPhone.slice(0, 2);
    const validDDDs = new Set([
        '11','12','13','14','15','16','17','18','19',
        '21','22','24','27','28',
        '31','32','33','34','35','37','38',
        '41','42','43','44','45','46',
        '47','48','49',
        '51','53','54','55',
        '61','62','64','63','65','66','67','68','69',
        '71','73','74','75','77','79',
        '81','82','83','84','85','86','87','88','89',
        '91','92','93','94','95','96','97','98','99'
    ]);
    if (!validDDDs.has(ddd)) {
        return { valid: false, error: 'DDD inválido. Confira o telefone no formato 41991665981.' };
    }
    if (cleanPhone[2] !== '9') {
        return { valid: false, error: 'Telefone inválido. Para celular, após o DDD deve começar com 9.' };
    }
    if (/^(\d)\1{10}$/.test(cleanPhone)) {
        return { valid: false, error: 'Telefone inválido. Número repetido não existe.' };
    }
    return { valid: true };
}

function validateEmail(email) {
    if (!email) return { valid: true }; // Email é opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Email inválido. Use um formato válido (ex: seu.email@empresa.com)' };
    }
    return { valid: true };
}

function validateCompany(company) {
    const trimmedCompany = company.trim();
    if (trimmedCompany.length < 2) {
        return { valid: false, error: 'O nome da empresa deve ter pelo menos 2 caracteres' };
    }
    return { valid: true };
}

function validateLeadFields({ name, phone, company, email = '' }) {
    const nameValidation = validateFullName(name || '');
    if (!nameValidation.valid) return nameValidation;

    const phoneValidation = validatePhoneBR(phone || '');
    if (!phoneValidation.valid) return phoneValidation;

    const companyValidation = validateCompany(company || '');
    if (!companyValidation.valid) return companyValidation;

    const emailValidation = validateEmail(email || '');
    if (!emailValidation.valid) return emailValidation;

    return { valid: true };
}

function handleDirectLead(event, formType = 'direct') {
    event.preventDefault();
    const form = event.target;
    const isFinal = formType === 'final';
    const name = document.getElementById(isFinal ? 'final-name' : 'direct-name')?.value || '';
    const phone = document.getElementById(isFinal ? 'final-phone' : 'direct-phone')?.value || '';
    const company = document.getElementById(isFinal ? 'final-company' : 'direct-company')?.value || '';
    
    const leadValidation = validateLeadFields({ name, phone, company });
    if (!leadValidation.valid) {
        alert(leadValidation.error);
        return;
    }
    
    const leadData = {
        nome: name.trim(),
        telefone: phone.replace(/\D/g, ''),
        empresa: company.trim(),
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
