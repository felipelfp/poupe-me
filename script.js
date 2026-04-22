/* --- CONSOLIDATED SCRIPT.JS --- */

// --- JORNADA DA EFICIÊNCIA (MAPA) LOGIC ---
(function() {
    const positions = [10, 24, 38, 52, 66, 80, 92];
    const thoughts = [
        "Ai meu Deus, acabou tudo! E agora?!",
        "20 e-mails?! 10 planilhas?! Eu não vou dar conta!",
        "Socorro! Como vou comparar tudo isso na mão?",
        "Rever tudo de novo?! Só podem estar brincando!",
        "Pelo amor de Deus, tomara que aprovem logo!",
        "Ufa! Finalmente o documento está pronto.",
        "Agora sim! Foco no que importa!"
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
        if (currentStep >= 6) return;
        currentStep++;
        updatePlayerPos();
        bubbleText.innerText = thoughts[currentStep - 1];
        bubbleContainer.style.display = 'block';
        dots.style.display = 'block';
    }

    function applySolution() {
        if (currentStep < 2) return;
        
        const isMobile = window.innerWidth <= 600;
        
        player.style.transition = "all 0.8s ease-in-out";
        currentStep = 0;
        updatePlayerPos();
        bubbleText.innerText = "Voltando para o início...";

        setTimeout(() => {
            const pathId = isMobile ? 'mapa-jump-path-mobile' : 'mapa-jump-path';
            const pathEl = document.getElementById(pathId);
            if (pathEl) pathEl.style.display = 'block';
            bubbleText.innerText = "SALTO DE EFICIÊNCIA! 🚀";
            
            setTimeout(() => {
                player.style.left = '';
                player.style.top = '';
                player.style.transition = 'none';

                if (!isMobile) {
                    player.classList.add('leaping');
                    currentStep = 6;
                } else {
                    player.classList.add('leaping-mobile');
                    currentStep = 6;
                }
                
                setTimeout(() => {
                    bubbleText.innerText = "A Poupe-me resolveu tudo! 🎯";
                    setTimeout(() => {
                        if (pathEl) pathEl.style.display = 'none';
                        
                        setTimeout(() => {
                            player.classList.remove('leaping', 'leaping-mobile');
                            player.style.transition = 'all 0.5s ease';
                            currentStep = 0;
                            updatePlayerPos();
                            startAutoJourney();
                        }, 3000);
                    }, 1500);
                }, 2000);
            }, 500);
        }, 1000);
    }

    function startAutoJourney() {
        setTimeout(() => {
            let stepInterval = setInterval(() => {
                if (currentStep < 3) {
                    moveNext();
                } else {
                    clearInterval(stepInterval);
                    setTimeout(() => {
                        applySolution();
                    }, 1500);
                }
            }, 2000);
        }, 1000);
    }

    window.addEventListener('resize', updateLayout);
    updateLayout();
    startAutoJourney();
})();


// --- JORNADA DO COMPRADOR (CAMINHO) LOGIC ---
(function() {
    const wizardEl = document.getElementById('caminho-wizard');
    const mountainsEl = document.getElementById('caminho-mountains');
    const dialogBox = document.getElementById('caminho-dialog-box');
    const optionsContainer = document.getElementById('caminho-options-container');
    const vendorNameEl = document.getElementById('caminho-vendor-name');
    const dialogTextEl = document.getElementById('caminho-dialog-text');
    const wisdomDisplay = document.getElementById('caminho-wisdom-display');
    const adventureUI = document.getElementById('caminho-adventure-ui');
    const adventureMsg = document.getElementById('caminho-adventure-msg');
    const totalPointsEl = document.getElementById('caminho-total-points');
    const obstacleContainer = document.getElementById('caminho-obstacle-container');
    const winScreen = document.getElementById('caminho-win-screen');
    const msgTitle = document.getElementById('caminho-msg-title');
    const msgDesc = document.getElementById('caminho-msg-desc');
    const msgSub = document.getElementById('caminho-msg-sub');
    const rewardBanner = document.getElementById('caminho-reward-banner');
    const gameOverScreen = document.getElementById('caminho-game-over-screen');
    const leadForm = document.getElementById('caminho-lead-form');

    let wisdom = 0;
    let runPoints = 0;
    let isWalking = true;
    let isAdventureMode = false;
    let canCollide = false;
    let distance = 0;
    let currentVendorIndex = 0;
    let mountainPos = 0;
    let activeVendorDiv = null;
    let nextVendorAt = 800;

    let wizBottom = 30;
    let vy = 0;
    let isJumping = false;
    let gameSpeed = 7;
    let obstacles = [];
    let frameCounter = 0;

    const gravity = 0.6;
    const jumpPower = -15;
    const groundLevel = 30;

    const vendors = [
        { name: "O Comprador", color: "#d84315", question: { text: "Qual destes elementos é a base da sua estratégia?", options: [{ text: "Preço Baixo", w: 10 }, { text: "Qualidade de Entrega", w: 15 }, { text: "Relacionamento", w: 12 }] } },
        { name: "A Gestora de Logística", color: "#2e7d32", question: { text: "O que é mais crítico na sua operação hoje?", options: [{ text: "Prazo de Entrega", w: 10 }, { text: "Giro de Estoque", w: 15 }, { text: "Eficiência de Custos", w: 12 }] } },
        { name: "O Diretor de Compras", color: "#455a64", question: { text: "O que garante o sucesso de um contrato de suprimentos?", options: [{ text: "Compliance Total", w: 10 }, { text: "Parceria Técnica", w: 15 }, { text: "Planejamento Estratégico", w: 12 }] } }
    ];

    function gameLoop() {
        const gameWrapper = document.getElementById('caminho-game-wrapper');
        const wrapperWidth = gameWrapper.offsetWidth;

        if (isWalking) {
            distance += isAdventureMode ? gameSpeed : 5;
            mountainPos -= isAdventureMode ? gameSpeed / 4 : 1;
            mountainsEl.style.left = (mountainPos % wrapperWidth) + "px";
            wizardEl.classList.add('walking');

            if (!isAdventureMode) {
                if (activeVendorDiv) {
                    let r = parseInt(activeVendorDiv.style.right || -200);
                    r += 5;
                    activeVendorDiv.style.right = r + "px";
                    if (r > wrapperWidth - 300) reachVendor();
                }
                if (distance >= nextVendorAt && currentVendorIndex < vendors.length) {
                    spawnVendor();
                    nextVendorAt += 1500;
                }
                if (currentVendorIndex >= vendors.length && distance > nextVendorAt - 200) {
                    initAdventure();
                }
            } else {
                frameCounter++;
                if (canCollide) {
                    if (frameCounter % 40 === 0) {
                        runPoints++;
                        updateTotal();
                    }
                    if (frameCounter > 40 && frameCounter % Math.max(60, Math.floor(120 - gameSpeed * 2)) === 0) {
                        spawnObstacle();
                    }
                    moveObstacles(wrapperWidth);
                    gameSpeed += 0.0005;
                }
                if (isJumping) {
                    vy += gravity;
                    wizBottom -= vy;
                    if (wizBottom <= groundLevel) { wizBottom = groundLevel; isJumping = false; vy = 0; }
                    wizardEl.style.bottom = wizBottom + "px";
                }
            }
        } else {
            wizardEl.classList.remove('walking');
        }
        requestAnimationFrame(gameLoop);
    }

    function updateTotal() {
        const total = wisdom + runPoints;
        totalPointsEl.textContent = total;
        if (total >= 100) rewardBanner.style.display = 'block';
    }

    function spawnVendor() {
        const v = vendors[currentVendorIndex];
        const div = document.createElement('div');
        div.className = 'vendor';
        div.style.right = "-200px";
        div.innerHTML = `<div class="vendor-person" style="background: ${v.color}"></div><div class="vendor-stall"></div>`;
        document.getElementById('caminho-vendor-container').appendChild(div);
        activeVendorDiv = div;
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
                wisdomDisplay.textContent = wisdom;
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
        const gameWrapper = document.getElementById('caminho-game-wrapper');
        const wrapperWidth = gameWrapper.offsetWidth;
        const timer = setInterval(() => {
            let r = parseInt(v.style.right);
            r += 10;
            v.style.right = r + "px";
            if (r > wrapperWidth + 200) { clearInterval(timer); v.remove(); }
        }, 16);
        activeVendorDiv = null;
        isWalking = true;
    }

    function initAdventure(isRestart = false) {
        isWalking = false;
        isAdventureMode = true;
        updateTotal();

        if (isRestart) {
            msgTitle.textContent = "QUASE LÁ!";
            msgDesc.textContent = "TENTE DE NOVO, UM PRÊMIO TE ESPERA! 🎁";
            msgSub.textContent = "Pule com ESPAÇO ou TOQUE na tela!";
        } else {
            msgTitle.textContent = "A CORRIDA FINAL!";
            msgDesc.textContent = "Pule com ESPAÇO ou TOQUE na tela!";
            msgSub.textContent = "Chegue a 100 pontos para ganhar!";
        }

        adventureMsg.style.display = 'block';
        setTimeout(() => {
            adventureMsg.style.display = 'none';
            adventureUI.style.display = 'block';
            isWalking = true;
            frameCounter = 0;
            setTimeout(() => { canCollide = true; }, 1000);
        }, 2500);
    }

    function spawnObstacle() {
        const o = document.createElement('div');
        o.className = 'obstacle';
        o.style.right = '-50px';
        o.style.bottom = groundLevel + 'px';
        obstacleContainer.appendChild(o);
        obstacles.push({ el: o, right: -50 });
    }

    function moveObstacles(wrapperWidth) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].right += gameSpeed;
            obstacles[i].el.style.right = obstacles[i].right + "px";
            if (canCollide) {
                const wizardX = 100;
                const wizardWidth = 40;
                const obstacleX = wrapperWidth - obstacles[i].right - 40; 
                if (wizardX + wizardWidth > obstacleX && wizardX < obstacleX + 40) {
                    if (wizBottom < groundLevel + 40) gameOver();
                }
            }
            if (obstacles[i].right > wrapperWidth + 100) {
                obstacles[i].el.remove();
                obstacles.splice(i, 1);
            }
        }
    }

    function gameOver() {
        const total = wisdom + runPoints;
        isWalking = false;
        canCollide = false;
        wizardEl.classList.remove('walking');
        if (total >= 100) {
            winGame();
        } else {
            gameOverScreen.style.display = 'flex';
        }
    }

    window.restartCaminhoRun = function() {
        gameOverScreen.style.display = 'none';
        obstacles.forEach(obs => obs.el.remove());
        obstacles = [];
        runPoints = 0;
        wizBottom = groundLevel;
        wizardEl.style.bottom = groundLevel + "px";
        gameSpeed = 7;
        frameCounter = 0;
        initAdventure(true);
    };

    window.resetCaminhoGame = function() {
        location.reload();
    };

    function winGame() {
        isWalking = false;
        canCollide = false;
        winScreen.style.display = 'flex';
    }

    function triggerJump() {
        if (!isJumping && isAdventureMode && isWalking) {
            isJumping = true;
            vy = jumpPower;
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            triggerJump();
            // Evita scroll se estiver na seção do jogo
            const rect = document.getElementById('jogo').getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) e.preventDefault();
        }
    });

    const gameSection = document.getElementById('jogo');
    gameSection.addEventListener('touchstart', (e) => {
        triggerJump();
        if (isAdventureMode) e.preventDefault();
    }, { passive: false });

    if (leadForm) {
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Dados enviados com sucesso! Nossa equipe entrará em contato.');
            location.reload();
        });
    }

    gameLoop();
})();
