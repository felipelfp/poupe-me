window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.altKey && e.code === 'KeyL') {
        window.exportLeadsReport();
    }
});

(function () {
    const positions = [10, 24, 38, 52, 66, 80, 92];
    const thoughts = [
        "Cadê aquela solicitação que estava aqui?",
        "20 fornecedores, 20 e-mails... que confusão!",
        "Passar tudo isso pra planilha vai levar o dia todo!",
        "O diretor pediu ajuste de novo? Não acredito...",
        "Espero que aprovem logo, não aguento mais esperar.",
        "Finalmente a ordem de compra... cansei.",
        "Chegou! Mas quanto tempo e dinheiro perdemos?"
    ];

    let currentStep = 0;
    const player = document.getElementById('mapa-player');
    const bubbleContainer = document.getElementById('mapa-bubble-container');
    const bubbleText = document.getElementById('mapa-bubble-text');
    const dots = document.getElementById('mapa-dots');

    function updateLayout() {
        const isMobile = window.innerWidth <= 600;
        positions.forEach((pos, i) => {
            const el = document.getElementById('mapa-m' + (i + 1));
            if (el) {
                if (isMobile) {
                    el.style.top = (15 + (i * 12.5)) + '%';
                    el.style.left = '75px';
                } else {
                    el.style.left = pos + '%';
                    el.style.top = '40%';
                }
            }
        });
        updatePlayerPos();
    }

    function updatePlayerPos() {
        const isMobile = window.innerWidth <= 600;
        const pos = isMobile ? (15 + (currentStep * 12.5)) + '%' : positions[currentStep] + '%';
        if (isMobile) {
            player.style.top = pos;
            player.style.left = '75px';
        } else {
            player.style.left = pos;
            player.style.top = '65%';
        }
    }

    function moveNext() {
        if (currentStep >= 6) {
            bubbleText.innerText = "Demorado né? Agora tente com o Poupe-me! 🚀";
            return;
        }
        currentStep++;
        player.style.transition = "all 0.5s ease-in-out";
        updatePlayerPos();
        bubbleText.innerText = thoughts[currentStep - 1];
        bubbleContainer.style.display = 'block';
        dots.style.display = 'block';

        if (currentStep === 6) {
            setTimeout(() => {
                bubbleText.innerText = "O Poupe-me, me ajuda!!! 😫";
                const notification = document.getElementById('mapa-notification');
                if (notification) notification.classList.add('show');
            }, 1000);
        }
    }

    function applySolution() {
        const isMobile = window.innerWidth <= 600;
        const pathId = isMobile ? 'mapa-jump-path-mobile' : 'mapa-jump-path';
        const pathEl = document.getElementById(pathId);
        
        if (pathEl) pathEl.style.display = 'block';
        bubbleText.innerText = "SALTO DE EFICIÊNCIA! 🚀";
        
        player.style.transition = 'none';
        player.style.left = ''; 
        player.style.top = '';

        const leapClass = isMobile ? 'leaping-mobile' : 'leaping';
        player.classList.add(leapClass);

        setTimeout(() => {
            player.classList.remove(leapClass);
            currentStep = 6;
            updatePlayerPos();
            player.style.transition = 'all 0.5s ease';
            bubbleText.innerText = "O Poupe-me resolveu tudo! 🎯";
            
            setTimeout(() => {
                if (pathEl) pathEl.style.display = 'none';
            }, 1000);
        }, 2200);
    }

    window.moveNext = moveNext;
    window.applySolution = applySolution;
    window.addEventListener('resize', updateLayout);
    updateLayout();
})();

(function () {
    const wizardEl = document.getElementById('caminho-wizard');
    const vendorContainer = document.getElementById('caminho-vendor-container');
    const obstacleContainer = document.getElementById('caminho-obstacle-container');
    const dialogBox = document.getElementById('caminho-dialog-box');
    const vendorNameEl = document.getElementById('caminho-vendor-name');
    const dialogTextEl = document.getElementById('caminho-dialog-text');
    const optionsContainer = document.getElementById('caminho-options-container');
    const mountainsEl = document.getElementById('caminho-mountains');
    const adventureUI = document.getElementById('caminho-adventure-ui');
    const totalPointsEl = document.getElementById('caminho-total-points');
    const adventureMsg = document.getElementById('caminho-adventure-msg');
    const msgTitle = document.getElementById('caminho-msg-title');
    const msgDesc = document.getElementById('caminho-msg-desc');
    const msgSub = document.getElementById('caminho-msg-sub');
    const rewardBanner = document.getElementById('caminho-reward-banner');
    const winScreen = document.getElementById('caminho-win-screen');
    const gameOverScreen = document.getElementById('caminho-game-over-screen');
    const leadForm = document.getElementById('caminho-lead-form');
    const consultancyBox = document.getElementById('caminho-consultancy-box');

    let wisdom = 0;
    let runPoints = 0;
    let isWalking = true;
    let isAdventureMode = false;
    let canCollide = false;
    let distance = 0;
    let currentVendorIndex = 0;
    let mountainPos = 0;
    let activeVendorDiv = null;
    let nextVendorAt = 400;
    let userChoices = [];
    let wizLeft = 100;
    let wizBottom = 100;
    let vy = 0;
    let isJumping = false;
    let gameSpeed = 7;
    let obstacles = [];
    let frameCounter = 0;
    let highScore = localStorage.getItem('poupeme_highscore') || 0;

    const gravity = 0.6;
    const jumpPower = -15;
    const groundLevel = 100;

    const vendors = [
        { name: "Perfil de Compras", color: "#d84315", question: { text: "Os materiais de limpeza, papelaria, copa e descartáveis são comprados via?", options: [{ text: "Cotações abertas de forma recorrente", w: 10 }, { text: "Comodato", w: 15 }, { text: "Contrato com preços fixos", w: 12 }] } },
        { name: "Estratégia", color: "#2e7d32", question: { text: "Qual destas opções é a base da sua estratégia de compras desses insumos?", options: [{ text: "Menor preço", w: 10 }, { text: "Produtos de qualidade", w: 15 }, { text: "Entrega rápida", w: 12 }, { text: "Desenvolvimento de parceria", w: 15 }] } },
        { name: "Desafios", color: "#455a64", question: { text: "O que é mais desafiador na sua operação de compras hoje?", options: [{ text: "Padronização de insumos de uso e consumo", w: 10 }, { text: "Compras descentralizadas e recorrentes", w: 15 }, { text: "Previsibilidade de custos (preços variam muito)", w: 12 }] } }
    ];

    function gameLoop() {
        if (localStorage.getItem('poupeme_completed') && !isAdventureMode) {
            document.getElementById('jogo').innerHTML = `<div style="padding: 50px; text-align: center; color: var(--gold); font-family: 'Cinzel', serif;">
                <h2>Jornada Concluída!</h2>
                <p>Você já realizou o seu diagnóstico e garantiu seu recorde. Nossa equipe elite entrará em contato em breve.</p>
                <button class="btn-submit" onclick="location.reload()" style="max-width: 200px; margin-top: 20px;">VOLTAR AO INÍCIO</button>
            </div>`;
            return;
        }

        const gameWrapper = document.getElementById('caminho-game-wrapper');
        if (!gameWrapper) return;
        const wrapperWidth = gameWrapper.offsetWidth;

        if (isWalking) {
            distance += isAdventureMode ? gameSpeed : 12;
            mountainPos -= isAdventureMode ? gameSpeed / 4 : 3; 
            mountainsEl.style.left = (mountainPos % wrapperWidth) + "px";
            wizardEl.classList.add('walking');

            if (!isAdventureMode) {
                if (activeVendorDiv) {
                    wizLeft += 10; 
                    wizardEl.style.left = wizLeft + "px";
                    const stopPoint = wrapperWidth - 360; 
                    if (wizLeft >= stopPoint) {
                        wizLeft = stopPoint;
                        wizardEl.style.left = wizLeft + "px";
                        reachVendor();
                    }
                }
                if (distance >= nextVendorAt && currentVendorIndex < vendors.length && !activeVendorDiv) {
                    spawnVendor();
                    nextVendorAt += 800;
                }
                if (currentVendorIndex >= vendors.length && distance > nextVendorAt - 200) {
                    isWalking = false;
                    showFirstReward();
                }
            } else {
                frameCounter++;
                if (canCollide) {
                    moveObstacles(wrapperWidth);
                    if (frameCounter % 100 === 0) spawnObstacle();
                    gameSpeed += 0.0005;
                }
                if (isJumping) {
                    vy += gravity; wizBottom -= vy;
                    if (wizBottom <= groundLevel) { wizBottom = groundLevel; isJumping = false; vy = 0; }
                    wizardEl.style.bottom = wizBottom + "px";
                }
            }
        } else { wizardEl.classList.remove('walking'); }
        requestAnimationFrame(gameLoop);
    }

    function spawnVendor() {
        const div = document.createElement('div');
        div.className = 'vendor';
        div.style.right = "100px";
        div.style.opacity = "0";
        div.innerHTML = `<div class="vendor-logo-container"><img src="1-removebg-preview.png" class="vendor-logo"></div><div class="vendor-stall"></div>`;
        vendorContainer.appendChild(div);
        activeVendorDiv = div;
        setTimeout(() => div.style.opacity = "1", 50);
    }

    function reachVendor() {
        isWalking = false;
        vendorNameEl.textContent = vendors[currentVendorIndex].name;
        const q = vendors[currentVendorIndex].question;
        dialogTextEl.textContent = q.text;
        optionsContainer.innerHTML = '';
        q.options.forEach(o => {
            const b = document.createElement('button');
            b.className = 'option-btn';
            b.textContent = o.text;
            b.onclick = () => {
                wisdom += o.w;
                userChoices.push({ vendedor: vendors[currentVendorIndex].name, escolha: o.text, pontos: o.w });
                leaveVendor();
            };
            optionsContainer.appendChild(b);
        });
        dialogBox.style.display = 'block';
    }

    function leaveVendor() {
        dialogBox.style.display = 'none';
        currentVendorIndex++;
        const v = activeVendorDiv;
        v.style.opacity = "0";
        setTimeout(() => v.remove(), 500);
        const returnInterval = setInterval(() => {
            if (wizLeft > 100) {
                wizLeft -= 5;
                wizardEl.style.left = wizLeft + "px";
            } else {
                wizLeft = 100;
                wizardEl.style.left = "100px";
                clearInterval(returnInterval);
            }
        }, 16);
        activeVendorDiv = null;
        isWalking = true;
    }

    function showFirstReward() {
        rewardBanner.style.display = 'block';
        setTimeout(() => {
            winScreen.style.display = 'flex';
        }, 2000);
    }

    window.submitLead = function (event) {
        if (event) event.preventDefault();
        
        const name = document.getElementById('lead-name').value;
        const phone = document.getElementById('lead-phone').value;
        const company = document.getElementById('lead-company').value;
        
        const resp1 = userChoices.find(c => c.vendedor === "Perfil de Compras")?.escolha || "N/A";
        const resp2 = userChoices.find(c => c.vendedor === "Estratégia")?.escolha || "N/A";
        const resp3 = userChoices.find(c => c.vendedor === "Desafios")?.escolha || "N/A";

        const leadData = {
            data: new Date().toLocaleString('pt-BR'),
            nome: name,
            telefone: phone,
            empresa: company,
            perfil: resp1,
            estrategia: resp2,
            desafios: resp3,
            pontos: runPoints
        };
        
        let leads = JSON.parse(localStorage.getItem('poupeme_leads') || '[]');
        leads.push(leadData);
        localStorage.setItem('poupeme_leads', JSON.stringify(leads));

        // ENVIO SILENCIOSO (AJAX)
        fetch("https://formsubmit.co/ajax/felipe.008lucas@gmail.com", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                _subject: "Novo Lead Jogo: Jornada Poupe-me",
                nome: name,
                telefone: phone,
                empresa: company,
                perfil_compras: resp1,
                estrategia: resp2,
                desafios: resp3
            })
        });

        // BACKUP WHATSAPP
        const msg = `🚀 *Novo Lead (Jornada Poupe-me)*\n\n*Nome:* ${name}\n*Telefone:* ${phone}\n*Empresa:* ${company}\n\n*Perfil:* ${resp1}\n*Estratégia:* ${resp2}\n*Desafios:* ${resp3}`;
        window.open(`https://wa.me/5541995731749?text=${encodeURIComponent(msg)}`, '_blank');

        winScreen.style.display = 'none';
        consultancyBox.style.display = 'block';
    };

    window.requestConsultancy = function () {
        consultancyBox.style.display = 'none';
        initAdventure();
    };

    function initAdventure(isRestart = false) {
        isWalking = false; 
        isAdventureMode = true; 
        runPoints = 0;
        document.getElementById('caminho-high-score').textContent = highScore;
        updateTotal();
        adventureMsg.style.display = 'block';
        msgTitle.textContent = "A CORRIDA FINAL!";
        msgDesc.textContent = "Pule com ESPAÇO ou TOQUE na tela!";
        msgSub.textContent = "Chegue a 50 pontos para resgatar sua consultoria!";
        msgSub.style.display = 'block';
        setTimeout(() => {
            adventureMsg.style.display = 'none';
            adventureUI.style.display = 'block';
            isWalking = true; 
            frameCounter = 0;
            setTimeout(() => { canCollide = true; }, 1000);
        }, 3000);
    }

    function spawnObstacle() {
        const o = document.createElement('div');
        o.className = 'obstacle'; o.style.right = '-50px'; o.style.bottom = groundLevel + 'px';
        obstacleContainer.appendChild(o);
        obstacles.push({ el: o, right: -50 });
    }

    function moveObstacles(wrapperWidth) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].right += gameSpeed;
            obstacles[i].el.style.right = obstacles[i].right + "px";
            if (canCollide) {
                const wizardX = 100; const wizardWidth = 40;
                const obstacleX = wrapperWidth - obstacles[i].right - 40;
                if (wizardX + wizardWidth > obstacleX && wizardX < obstacleX + 40) {
                    if (wizBottom < groundLevel + 40) gameOver();
                }
            }
            if (obstacles[i].right > wrapperWidth + 100) { obstacles[i].el.remove(); obstacles.splice(i, 1); }
        }
    }

    function gameOver() {
        isWalking = false; canCollide = false; wizardEl.classList.remove('walking');
        gameOverScreen.style.display = 'flex';
    }

    window.restartCaminhoRun = function () {
        gameOverScreen.style.display = 'none';
        obstacles.forEach(obs => obs.el.remove());
        obstacles = []; runPoints = 0; wizBottom = groundLevel;
        wizardEl.style.bottom = groundLevel + "px";
        gameSpeed = 7; frameCounter = 0; initAdventure(true);
    };

    window.resetCaminhoGame = function () { location.reload(); };

    function winGame() { 
        localStorage.setItem('poupeme_completed', 'true');
        adventureMsg.style.display = 'block';
        msgTitle.textContent = "🏆 EXCELENTE!";
        msgDesc.textContent = "VOCÊ CONQUISTOU SUA CONSULTORIA!";
        msgSub.textContent = "Continue correndo pelo seu RECORDE!";
        setTimeout(() => {
            adventureMsg.style.display = 'none';
        }, 3000);
    }

    function updateTotal() {
        totalPointsEl.textContent = runPoints;
        if (runPoints > highScore) {
            highScore = runPoints;
            localStorage.setItem('poupeme_highscore', highScore);
            document.getElementById('caminho-high-score').textContent = highScore;
        }
        if (runPoints === 50) winGame(); 
    }

    function triggerJump() {
        if (!isJumping && isAdventureMode && isWalking) { 
            isJumping = true; 
            vy = jumpPower; 
            runPoints += 10; 
            updateTotal();
        }
    }

    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { 
            const rect = document.getElementById('jogo').getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) e.preventDefault();
            triggerJump(); 
        }
    });

    const gameSection = document.getElementById('jogo');
    gameSection.addEventListener('touchstart', (e) => {
        const rect = gameSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            triggerJump();
            if (isAdventureMode) e.preventDefault();
        }
    }, { passive: false });

    gameLoop();
})();

window.showDirectLeadForm = function() {
    document.getElementById('direct-lead-modal').style.display = 'flex';
}

window.closeDirectLeadForm = function() {
    document.getElementById('direct-lead-modal').style.display = 'none';
}

window.showSuccessModal = function() {
    document.getElementById('success-modal').style.display = 'flex';
}

window.closeSuccessModal = function() {
    document.getElementById('success-modal').style.display = 'none';
}

window.handleDirectLead = function(event, source = 'modal') {
    if (event) event.preventDefault();
    let name, phone, company;
    if (source === 'final') {
        name = document.getElementById('final-name').value;
        phone = document.getElementById('final-phone').value;
        company = document.getElementById('final-company').value;
    } else {
        name = document.getElementById('direct-name').value;
        phone = document.getElementById('direct-phone').value;
        company = document.getElementById('direct-company').value;
    }

    const lead = {
        data: new Date().toLocaleString(),
        nome: name,
        telefone: phone,
        empresa: company,
        escolhas: source === 'final' ? 'CADASTRO FINAL' : 'SOLICITAÇÃO DIRETA',
        tipo: 'DIRETO'
    };

    let leads = JSON.parse(localStorage.getItem('poupeme_leads') || '[]');
    leads.push(lead);
    localStorage.setItem('poupeme_leads', JSON.stringify(leads));

    // ENVIO SILENCIOSO
    fetch("https://formsubmit.co/ajax/felipe.008lucas@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
            _subject: "Novo Lead Direto: Jornada Poupe-me",
            nome: name,
            telefone: phone,
            empresa: company,
            origem: lead.escolhas
        })
    });

    // BACKUP WHATSAPP
    const msg = `🎯 *Novo Lead Direto (Poupe-me)*\n\n*Nome:* ${name}\n*Telefone:* ${phone}\n*Empresa:* ${company}\n*Origem:* ${lead.escolhas}`;
    window.open(`https://wa.me/5541995731749?text=${encodeURIComponent(msg)}`, '_blank');

    showSuccessModal();
    if (source === 'modal') {
        setTimeout(() => {
            closeDirectLeadForm();
            document.getElementById('direct-lead-form').reset();
        }, 100);
    } else {
        setTimeout(() => {
            document.getElementById('final-embedded-form').reset();
        }, 100);
    }
}

window.exportLeadsReport = function() {
    const leads = JSON.parse(localStorage.getItem('poupeme_leads') || '[]');
    if (leads.length === 0) {
        showSuccessModal(); 
        return;
    }
    let csvContent = "\ufeff"; 
    csvContent += "DATA;NOME;TELEFONE;EMPRESA;PERFIL COMPRAS;ESTRATEGIA;DESAFIOS;PONTOS JOGO\n";
    leads.forEach(l => {
        const clean = (txt) => txt ? String(txt).replace(/;/g, ',').replace(/"/g, "'") : "";
        csvContent += `"${clean(l.data)}";"${clean(l.nome)}";"${clean(l.telefone)}";"${clean(l.empresa)}";"${clean(l.perfil)}";"${clean(l.estrategia)}";"${clean(l.desafios)}";"${l.pontos || 0}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "leads_elite_poupeme.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};