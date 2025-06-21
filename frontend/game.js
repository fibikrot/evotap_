/**
 * EvoTap - Evolution Clicker Frontend
 * Клиентская логика эволюционного кликера
 */

class EvoTapGame {
    constructor() {
        this.userId = this.generateUserId();
        this.playerData = null;
        this.eras = [];
        this.organelles = [];
        this.gameLoopInterval = null;
        this.autoClickInterval = null;
        this.uiUpdateInterval = null;
        this.clickEffectId = 0;
        
        // Web3 интеграция
        this.web3 = null;
        this.account = null;
        
        // Игровые данные
        this.selectedOrganisms = [];
        this.currentTab = 'clicks';
        
        // Звуки (заглушки)
        this.sounds = {
            click: () => console.log('🔊 Click sound'),
            achievement: () => console.log('🔊 Achievement sound'),
            mutation: () => console.log('🔊 Mutation sound'),
            buy: () => console.log('🔊 Buy sound')
        };
        
        // Состояние загрузки
        this.isLoading = false;
        this.loadingProgress = 0;
        
        // Элементы DOM
        this.elements = {};
    }

    generateUserId() {
        // Генерируем уникальный ID пользователя
        const stored = localStorage.getItem('evotap_user_id');
        if (stored) return stored;
        
        const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('evotap_user_id', newId);
        return newId;
    }

    async init() {
        console.log('🧬 Инициализация EvoTap...');
        
        this.showLoading();
        
        try {
            // Кэшируем элементы DOM
            this.cacheElements();
            
            // Загружаем игровые данные
            await this.loadGameData();
            
            // Загружаем эры и органеллы
            await Promise.all([
                this.loadEras(),
                this.loadOrganelles()
            ]);
            
            // Инициализируем Web3 (опционально)
            await this.initWeb3();
            
            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Обновляем UI
            this.updateUI();
            
            // Запускаем игровые циклы
            this.startGameLoops();
            
            console.log('✅ EvoTap успешно инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showNotification('Ошибка загрузки игры', 'error');
        } finally {
            this.hideLoading();
        }
    }

    cacheElements() {
        // Кэшируем часто используемые элементы DOM
        this.elements = {
            dnaCount: document.getElementById('dna-count'),
            playerLevel: document.getElementById('player-level'),
            tokenBalance: document.getElementById('token-balance'),
            eraEmoji: document.getElementById('era-emoji'),
            eraName: document.getElementById('era-name'),
            eraDescription: document.getElementById('era-description'),
            eraMultiplier: document.getElementById('era-multiplier'),
            clickZone: document.getElementById('click-zone'),
            organism: document.getElementById('organism'),
            totalClicks: document.getElementById('total-clicks'),
            clicksPerSecond: document.getElementById('clicks-per-second'),
            organellesList: document.getElementById('organelles-list'),
            erasList: document.getElementById('eras-list'),
            organismsList: document.getElementById('organisms-list'),
            mutateBtn: document.getElementById('mutate-btn'),
            breedBtn: document.getElementById('breed-btn'),
            notifications: document.getElementById('notifications')
        };
    }

    async initWeb3() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                console.log('✅ Web3 инициализирован');
            } else {
                console.log('ℹ️ Web3 недоступен, работаем без криптовалюты');
            }
        } catch (error) {
            console.log('⚠️ Ошибка инициализации Web3:', error.message);
        }
    }

    async connectWallet() {
        if (!this.web3) {
            this.showNotification('Web3 недоступен', 'warning');
            return false;
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            this.account = accounts[0];
            this.showNotification('Кошелек подключен!', 'success');
            return true;
        } catch (error) {
            this.showNotification('Ошибка подключения кошелька', 'error');
            return false;
        }
    }

    async loadGameData() {
        try {
            const response = await fetch(`/api/player/${this.userId}`);
            if (!response.ok) throw new Error('Ошибка загрузки данных игрока');
            
            this.playerData = await response.json();
            console.log('📊 Данные игрока загружены:', this.playerData);
        } catch (error) {
            console.error('❌ Ошибка загрузки данных игрока:', error);
            throw error;
        }
    }

    async loadEras() {
        try {
            const response = await fetch('/api/eras');
            if (!response.ok) throw new Error('Ошибка загрузки эр');
            
            this.eras = await response.json();
            console.log('🌍 Эры загружены:', this.eras.length);
        } catch (error) {
            console.error('❌ Ошибка загрузки эр:', error);
            throw error;
        }
    }

    async loadOrganelles() {
        try {
            const response = await fetch('/api/organelles');
            if (!response.ok) throw new Error('Ошибка загрузки органелл');
            
            this.organelles = await response.json();
            console.log('🔬 Органеллы загружены:', this.organelles.length);
        } catch (error) {
            console.error('❌ Ошибка загрузки органелл:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Клик по организму
        this.elements.clickZone.addEventListener('click', (e) => this.handleClick(e));
        
        // Кнопки действий
        this.elements.mutateBtn.addEventListener('click', () => this.handleMutation());
        this.elements.breedBtn.addEventListener('click', () => this.openBreedingModal());
        
        // Кнопки футера
        document.getElementById('exchange-btn').addEventListener('click', () => this.openExchangeModal());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.openLeaderboardModal());
        document.getElementById('achievements-btn').addEventListener('click', () => this.openAchievementsModal());
        
        // Модальные окна
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });
        
        // Закрытие модалок по клику вне их области
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
        
        // Обмен ДНК
        document.getElementById('dna-amount').addEventListener('input', (e) => {
            const amount = parseInt(e.target.value) || 0;
            const tokens = Math.floor(amount / 100);
            document.getElementById('tokens-preview').textContent = tokens;
        });
        
        document.getElementById('confirm-exchange').addEventListener('click', () => this.handleExchange());
        
        // Лидерборд табы
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchLeaderboardTab(tab);
            });
        });
        
        // Скрещивание
        document.getElementById('confirm-breeding').addEventListener('click', () => this.handleBreeding());
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleClick({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
            }
        });
    }

    async handleClick(event) {
        if (this.isLoading) return;
        
        try {
            // Отправляем клик на сервер
            const response = await fetch('/api/evolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId, clicks: 1 })
            });
            
            if (!response.ok) throw new Error('Ошибка обработки клика');
            
            const result = await response.json();
            
            // Обновляем данные игрока
            this.playerData = result.player;
            
            // Создаем визуальный эффект
            this.createClickEffect(event);
            
            // Воспроизводим звук
            this.sounds.click();
            
            // Показываем новые достижения
            if (result.newAchievements && result.newAchievements.length > 0) {
                result.newAchievements.forEach(achievement => {
                    this.showNotification(`🏆 Достижение: ${achievement.name}!`, 'success');
                    this.sounds.achievement();
                });
            }
            
            // Обновляем UI
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Ошибка клика:', error);
            this.showNotification('Ошибка клика', 'error');
        }
    }

    createClickEffect(event) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = '+' + Math.floor(Math.random() * 10 + 1);
        effect.id = 'effect-' + (++this.clickEffectId);
        
        // Позиционируем эффект
        const rect = this.elements.clickZone.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        
        // Добавляем в контейнер эффектов
        document.getElementById('click-effects').appendChild(effect);
        
        // Удаляем через 2 секунды
        setTimeout(() => {
            const el = document.getElementById(effect.id);
            if (el) el.remove();
        }, 2000);
        
        // Анимация организма
        this.elements.organism.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.elements.organism.style.transform = 'scale(1)';
        }, 100);
    }

    async handleMutation() {
        if (this.isLoading) return;
        
        const cost = 1000 * Math.pow(2, this.playerData.organisms.length);
        
        if (this.playerData.dna < cost) {
            this.showNotification(`Недостаточно ДНК! Нужно: ${cost}`, 'warning');
            return;
        }
        
        try {
            this.isLoading = true;
            this.elements.mutateBtn.disabled = true;
            this.elements.mutateBtn.textContent = '🧪 Мутация...';
            
            const response = await fetch('/api/mutate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId })
            });
            
            if (!response.ok) throw new Error('Ошибка мутации');
            
            const result = await response.json();
            
            // Обновляем данные игрока
            this.playerData.dna = result.remainingDNA;
            this.playerData.organisms.push(result.organism);
            
            // Показываем результат мутации
            this.showMutationResult(result.organism);
            
            // Звук мутации
            this.sounds.mutation();
            
            // Обновляем UI
            this.updateUI();
            
            this.showNotification(`🧬 Создан организм: ${result.organism.name}!`, 'success');
            
        } catch (error) {
            console.error('❌ Ошибка мутации:', error);
            this.showNotification('Ошибка мутации', 'error');
        } finally {
            this.isLoading = false;
            this.updateButtonStates();
        }
    }

    showMutationResult(organism) {
        const modal = document.getElementById('mutation-modal');
        const container = document.getElementById('new-organism');
        
        container.innerHTML = `
            <div class="organism-card rarity-${organism.rarity}">
                <div class="organism-header">
                    <h4 class="organism-name">${organism.name}</h4>
                    <span class="organism-rarity rarity-${organism.rarity}">${organism.rarity}</span>
                </div>
                <div class="organism-traits">
                    ${Object.entries(organism.traits).map(([key, value]) => 
                        `<div class="trait"><strong>${key}:</strong> ${value}</div>`
                    ).join('')}
                </div>
                <div class="organism-stats">
                    <div>Сила: ${organism.power}</div>
                    <div>Эра: ${organism.era}</div>
                    <div>Поколение: ${organism.generation}</div>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    openBreedingModal() {
        if (this.playerData.organisms.length < 2) {
            this.showNotification('Нужно минимум 2 организма для скрещивания', 'warning');
            return;
        }
        
        if (this.playerData.dna < 5000) {
            this.showNotification('Недостаточно ДНК! Нужно: 5000', 'warning');
            return;
        }
        
        const modal = document.getElementById('breeding-modal');
        const container = document.getElementById('breeding-organisms');
        
        // Заполняем список организмов
        container.innerHTML = this.playerData.organisms.map(organism => `
            <div class="organism-card breeding-organism" data-id="${organism.id}">
                <div class="organism-header">
                    <h5>${organism.name}</h5>
                    <span class="organism-rarity rarity-${organism.rarity}">${organism.rarity}</span>
                </div>
                <div class="organism-power">Сила: ${organism.power}</div>
            </div>
        `).join('');
        
        // Обработчики выбора организмов
        container.querySelectorAll('.breeding-organism').forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('selected')) {
                    card.classList.remove('selected');
                    this.selectedOrganisms = this.selectedOrganisms.filter(id => id !== card.dataset.id);
                } else if (this.selectedOrganisms.length < 2) {
                    card.classList.add('selected');
                    this.selectedOrganisms.push(card.dataset.id);
                }
                
                document.getElementById('confirm-breeding').disabled = this.selectedOrganisms.length !== 2;
            });
        });
        
        modal.classList.add('show');
    }

    async handleBreeding() {
        if (this.selectedOrganisms.length !== 2) return;
        
        try {
            const response = await fetch('/api/breed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    organism1Id: this.selectedOrganisms[0],
                    organism2Id: this.selectedOrganisms[1]
                })
            });
            
            if (!response.ok) throw new Error('Ошибка скрещивания');
            
            const result = await response.json();
            
            // Обновляем данные
            this.playerData.dna = result.remainingDNA;
            this.playerData.organisms.push(result.hybrid);
            
            // Закрываем модалку
            document.getElementById('breeding-modal').classList.remove('show');
            this.selectedOrganisms = [];
            
            // Показываем результат
            this.showMutationResult(result.hybrid);
            
            this.showNotification(`🔬 Создан гибрид: ${result.hybrid.name}!`, 'success');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Ошибка скрещивания:', error);
            this.showNotification('Ошибка скрещивания', 'error');
        }
    }

    openExchangeModal() {
        document.getElementById('exchange-modal').classList.add('show');
    }

    async handleExchange() {
        const amount = parseInt(document.getElementById('dna-amount').value);
        
        if (!amount || amount < 100) {
            this.showNotification('Минимум 100 ДНК для обмена', 'warning');
            return;
        }
        
        if (amount > this.playerData.dna) {
            this.showNotification('Недостаточно ДНК', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/exchange-dna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId, dnaAmount: amount })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            
            const result = await response.json();
            
            // Обновляем данные
            this.playerData.dna = result.remainingDNA;
            if (this.playerData.tokenBalance !== undefined) {
                this.playerData.tokenBalance += result.tokensReceived;
            }
            
            // Закрываем модалку
            document.getElementById('exchange-modal').classList.remove('show');
            document.getElementById('dna-amount').value = '';
            document.getElementById('tokens-preview').textContent = '0';
            
            this.showNotification(`💰 Получено ${result.tokensReceived} $DNA токенов!`, 'success');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Ошибка обмена:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async openLeaderboardModal() {
        const modal = document.getElementById('leaderboard-modal');
        modal.classList.add('show');
        await this.loadLeaderboard();
    }

    async loadLeaderboard(type = 'clicks') {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) throw new Error('Ошибка загрузки лидерборда');
            
            const data = await response.json();
            const container = document.getElementById('leaderboard-content');
            
            let content = '';
            
            if (type === 'clicks') {
                content = data.topClicks.map((player, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${player.rank}</span>
                        <span class="player-name">${player.id}</span>
                        <span class="player-score">${player.totalClicks} эволюций</span>
                    </div>
                `).join('');
            } else if (type === 'level') {
                content = data.topLevel.map((player, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${player.rank}</span>
                        <span class="player-name">${player.id}</span>
                        <span class="player-score">Уровень ${player.level}</span>
                    </div>
                `).join('');
            } else if (type === 'nfts') {
                content = data.topNFTs.map((player, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${player.rank}</span>
                        <span class="player-name">${player.id}</span>
                        <span class="player-score">${player.nfts} NFT</span>
                    </div>
                `).join('');
            }
            
            container.innerHTML = content;
            
            // Обновляем активную вкладку
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === type);
            });
            
            this.currentTab = type;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки лидерборда:', error);
            this.showNotification('Ошибка загрузки лидерборда', 'error');
        }
    }

    switchLeaderboardTab(type) {
        this.loadLeaderboard(type);
    }

    openAchievementsModal() {
        document.getElementById('achievements-modal').classList.add('show');
        this.loadAchievements();
    }

    loadAchievements() {
        // Заглушка для достижений
        const achievements = [
            { id: 1, name: "Первая клетка", requirement: 1, type: "clicks", earned: true },
            { id: 2, name: "Деление клетки", requirement: 10, type: "clicks", earned: true },
            { id: 3, name: "Колония", requirement: 100, type: "clicks", earned: false },
            { id: 4, name: "Многоклеточность", requirement: 1000, type: "clicks", earned: false }
        ];
        
        const container = document.getElementById('achievements-list');
        
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.earned ? 'earned' : 'locked'}">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-requirement">
                    ${achievement.type === 'clicks' ? `${achievement.requirement} кликов` : achievement.requirement}
                </div>
                <div class="achievement-status">
                    ${achievement.earned ? '✅ Получено' : '🔒 Заблокировано'}
                </div>
            </div>
        `).join('');
    }

    async buyOrganelle(organelleId) {
        if (this.isLoading) return;
        
        const organelle = this.organelles.find(o => o.id === organelleId);
        if (!organelle) return;
        
        if (this.playerData.dna < organelle.cost) {
            this.showNotification(`Недостаточно ДНК! Нужно: ${organelle.cost}`, 'warning');
            return;
        }
        
        if (this.playerData.organelles.includes(organelleId)) {
            this.showNotification('Органелла уже куплена!', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/buy-organelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId, organelleId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            
            const result = await response.json();
            
            // Обновляем данные
            this.playerData.dna = result.remainingDNA;
            this.playerData.organelles.push(organelleId);
            
            // Обновляем пассивный доход
            if (organelle.passive) {
                this.playerData.passiveIncome = (this.playerData.passiveIncome || 0) + organelle.passive;
            }
            
            this.sounds.buy();
            this.showNotification(`🔬 Куплена органелла: ${organelle.name}!`, 'success');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Ошибка покупки органеллы:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async unlockEra(eraId) {
        if (this.isLoading) return;
        
        const era = this.eras.find(e => e.id === eraId);
        if (!era) return;
        
        if (this.playerData.dna < era.unlockCost) {
            this.showNotification(`Недостаточно ДНК! Нужно: ${era.unlockCost}`, 'warning');
            return;
        }
        
        if (this.playerData.unlockedEras.includes(eraId)) {
            this.showNotification('Эра уже разблокирована!', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/unlock-era', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId, eraId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            
            const result = await response.json();
            
            // Обновляем данные
            this.playerData.dna = result.remainingDNA;
            this.playerData.unlockedEras.push(eraId);
            this.playerData.currentEra = eraId;
            
            // Показываем новые достижения
            if (result.newAchievements && result.newAchievements.length > 0) {
                result.newAchievements.forEach(achievement => {
                    this.showNotification(`🏆 Достижение: ${achievement.name}!`, 'success');
                });
            }
            
            this.sounds.buy();
            this.showNotification(`🌍 Разблокирована эра: ${era.name}!`, 'success');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Ошибка разблокировки эры:', error);
            this.showNotification(error.message, 'error');
        }
    }

    updateUI() {
        if (!this.playerData) return;
        
        // Обновляем основные показатели
        this.elements.dnaCount.textContent = this.formatNumber(this.playerData.dna);
        this.elements.playerLevel.textContent = this.playerData.level;
        this.elements.tokenBalance.textContent = this.playerData.tokenBalance || 0;
        this.elements.totalClicks.textContent = this.formatNumber(this.playerData.totalClicks);
        this.elements.clicksPerSecond.textContent = this.formatNumber(this.playerData.clicksPerSecond || 0);
        
        // Обновляем информацию об эре
        const currentEra = this.eras.find(era => era.id === this.playerData.currentEra);
        if (currentEra) {
            this.elements.eraEmoji.textContent = currentEra.emoji;
            this.elements.eraName.textContent = currentEra.name;
            this.elements.eraDescription.textContent = currentEra.description;
            this.elements.eraMultiplier.textContent = `x${currentEra.multiplier}`;
        }
        
        // Обновляем списки
        this.updateOrganellesList();
        this.updateErasList();
        this.updateOrganismsList();
        this.updateButtonStates();
    }

    updateOrganellesList() {
        if (!this.organelles.length || !this.playerData) return;
        
        this.elements.organellesList.innerHTML = this.organelles.map(organelle => {
            const owned = this.playerData.organelles.includes(organelle.id);
            const canAfford = this.playerData.dna >= organelle.cost;
            
            return `
                <div class="upgrade-item ${owned ? 'owned' : ''}" 
                     onclick="${owned ? '' : `game.buyOrganelle(${organelle.id})`}">
                    <div class="upgrade-info">
                        <div class="upgrade-name">${organelle.emoji} ${organelle.name}</div>
                        <div class="upgrade-effect">${organelle.effect}</div>
                        <div class="upgrade-cost">
                            ${owned ? '✅ Куплено' : 
                              canAfford ? `💰 ${organelle.cost} ДНК` : 
                              `🔒 ${organelle.cost} ДНК`}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateErasList() {
        if (!this.eras.length || !this.playerData) return;
        
        this.elements.erasList.innerHTML = this.eras.map(era => {
            const unlocked = this.playerData.unlockedEras.includes(era.id);
            const current = this.playerData.currentEra === era.id;
            const canAfford = this.playerData.dna >= era.unlockCost;
            
            return `
                <div class="era-item ${current ? 'current' : ''} ${!unlocked ? 'locked' : ''}"
                     onclick="${unlocked || era.unlockCost === 0 ? '' : `game.unlockEra(${era.id})`}">
                    <div class="era-header">
                        <span>${era.emoji} ${era.name}</span>
                        <span>x${era.multiplier}</span>
                    </div>
                    <div class="era-desc">${era.description}</div>
                    <div class="era-unlock-cost">
                        ${unlocked ? (current ? '🌟 Текущая' : '✅ Разблокирована') :
                          era.unlockCost === 0 ? 'Бесплатно' :
                          canAfford ? `💰 ${era.unlockCost} ДНК` :
                          `🔒 ${era.unlockCost} ДНК`}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateOrganismsList() {
        if (!this.playerData.organisms) return;
        
        this.elements.organismsList.innerHTML = this.playerData.organisms.map(organism => `
            <div class="organism-card rarity-${organism.rarity}">
                <div class="organism-header">
                    <h5 class="organism-name">${organism.name}</h5>
                    <span class="organism-rarity rarity-${organism.rarity}">${organism.rarity}</span>
                </div>
                <div class="organism-traits">
                    ${Object.entries(organism.traits).map(([key, value]) => 
                        `<div class="trait"><strong>${key}:</strong> ${value}</div>`
                    ).join('')}
                </div>
                <div class="organism-power">Сила: ${organism.power}</div>
            </div>
        `).join('') || '<div style="text-align: center; color: #666;">Организмы появятся после мутаций</div>';
    }

    updateButtonStates() {
        if (!this.playerData) return;
        
        // Кнопка мутации
        const mutationCost = 1000 * Math.pow(2, this.playerData.organisms.length);
        const canMutate = this.playerData.dna >= mutationCost && !this.isLoading;
        
        this.elements.mutateBtn.disabled = !canMutate;
        this.elements.mutateBtn.textContent = `🧪 Мутация (${mutationCost} ДНК)`;
        
        // Кнопка скрещивания
        const canBreed = this.playerData.organisms.length >= 2 && this.playerData.dna >= 5000 && !this.isLoading;
        this.elements.breedBtn.disabled = !canBreed;
    }

    startGameLoops() {
        // Основной игровой цикл (обновление UI)
        this.uiUpdateInterval = setInterval(() => {
            if (this.playerData) {
                this.updateUI();
            }
        }, 1000);
        
        // Автоматические клики от органелл
        this.autoClickInterval = setInterval(() => {
            if (this.playerData && this.playerData.organelles) {
                let autoClicks = 0;
                this.playerData.organelles.forEach(organelleId => {
                    const organelle = this.organelles.find(o => o.id === organelleId);
                    if (organelle && organelle.autoClick) {
                        autoClicks += organelle.autoClick;
                    }
                });
                
                if (autoClicks > 0) {
                    this.handleClick({ clientX: 0, clientY: 0 });
                }
            }
        }, 2000);
        
        // Сохранение состояния игры
        this.gameLoopInterval = setInterval(() => {
            this.saveGameState();
        }, 30000); // каждые 30 секунд
    }

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.elements.notifications.appendChild(notification);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    saveGameState() {
        if (this.playerData) {
            localStorage.setItem('evotap_game_state', JSON.stringify({
                userId: this.userId,
                lastSave: Date.now(),
                playerData: this.playerData
            }));
        }
    }

    destroy() {
        // Очищаем интервалы
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        if (this.autoClickInterval) clearInterval(this.autoClickInterval);
        if (this.uiUpdateInterval) clearInterval(this.uiUpdateInterval);
        
        // Сохраняем состояние
        this.saveGameState();
        
        console.log('🧬 EvoTap остановлен');
    }
}

// Глобальная переменная для доступа к игре
let game;

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    game = new EvoTapGame();
    game.init().catch(console.error);
});

// Остановка игры при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (game) game.destroy();
}); 