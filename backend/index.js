/**
 * EvoTap - Evolution Clicker Backend
 * Серверная логика эволюционного кликера
 */

const Core = require('../../../core');
const express = require('express');
const path = require('path');

class EvoTapGame {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.players = new Map();
        
        // Эволюционные эры
        this.eras = [
            {
                id: 1,
                name: "Клеточная эра",
                emoji: "🦠",
                description: "Простейшие организмы в первичном бульоне",
                unlockCost: 0,
                multiplier: 1,
                maxLevel: 50
            },
            {
                id: 2,
                name: "Многоклеточная эра", 
                emoji: "🐛",
                description: "Формирование сложных организмов",
                unlockCost: 1000,
                multiplier: 2,
                maxLevel: 100
            },
            {
                id: 3,
                name: "Эра животных",
                emoji: "🦕", 
                description: "Хищники и жертвы",
                unlockCost: 10000,
                multiplier: 5,
                maxLevel: 200
            },
            {
                id: 4,
                name: "Эра разума",
                emoji: "🧠",
                description: "Развитие интеллекта и технологий", 
                unlockCost: 100000,
                multiplier: 10,
                maxLevel: 500
            },
            {
                id: 5,
                name: "Космическая эра",
                emoji: "🚀",
                description: "Галактическая экспансия",
                unlockCost: 1000000,
                multiplier: 25,
                maxLevel: 1000
            }
        ];

        // Органеллы и улучшения
        this.organelles = [
            { id: 1, name: "Митохондрии", emoji: "⚡", cost: 10, effect: "x2 к производству ДНК", multiplier: 2 },
            { id: 2, name: "Ядро", emoji: "🔵", cost: 50, effect: "Автоматическое деление", autoClick: 1 },
            { id: 3, name: "Рибосомы", emoji: "🔬", cost: 100, effect: "x3 к производству ДНК", multiplier: 3 },
            { id: 4, name: "ЭПС", emoji: "🌐", cost: 250, effect: "Автоматическое деление x2", autoClick: 2 },
            { id: 5, name: "Хлоропласты", emoji: "🌱", cost: 500, effect: "Пассивный доход ДНК", passive: 5 },
            { id: 6, name: "Вакуоли", emoji: "💧", cost: 1000, effect: "x5 к производству ДНК", multiplier: 5 },
            { id: 7, name: "Цитоскелет", emoji: "🦴", cost: 2500, effect: "Автоматическое деление x5", autoClick: 5 },
            { id: 8, name: "Лизосомы", emoji: "🗑️", cost: 5000, effect: "Защита от вирусов", protection: true }
        ];

        // Трейты для NFT организмов
        this.traits = [
            { id: 1, name: "Скорость", values: ["Медленный", "Быстрый", "Стремительный", "Молниеносный"] },
            { id: 2, name: "Сила", values: ["Слабый", "Сильный", "Мощный", "Титанический"] },
            { id: 3, name: "Интеллект", values: ["Примитивный", "Умный", "Гениальный", "Сверхразум"] },
            { id: 4, name: "Адаптивность", values: ["Хрупкий", "Стойкий", "Адаптивный", "Неуязвимый"] },
            { id: 5, name: "Размер", values: ["Микро", "Малый", "Средний", "Гигантский"] },
            { id: 6, name: "Цвет", values: ["Серый", "Зеленый", "Синий", "Золотой", "Радужный"] }
        ];

        // Достижения
        this.achievements = [
            { id: 1, name: "Первая клетка", requirement: 1, type: "clicks", nft: "Bronze Cell", reward: 10 },
            { id: 2, name: "Деление клетки", requirement: 10, type: "clicks", nft: null, reward: 25 },
            { id: 3, name: "Колония", requirement: 100, type: "clicks", nft: "Silver Colony", reward: 100 },
            { id: 4, name: "Многоклеточность", requirement: 1000, type: "clicks", nft: "Gold Organism", reward: 500 },
            { id: 5, name: "Сложная жизнь", requirement: 10000, type: "clicks", nft: "Diamond Life", reward: 2500 },
            { id: 6, name: "Эволюционный скачок", requirement: 2, type: "era", nft: "Epic Evolution", reward: 1000 },
            { id: 7, name: "Властелин эволюции", requirement: 5, type: "era", nft: "Mythic Master", reward: 10000 },
            { id: 8, name: "Генетический коллекционер", requirement: 10, type: "nfts", nft: "Legendary Collector", reward: 5000 },
            { id: 9, name: "Скоростная эволюция", requirement: 100, type: "cps", nft: "Cosmic Speed", reward: 7500 }
        ];
    }

    async init() {
        await Core.init();
        
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../frontend')));
        
        this.setupRoutes();
        console.log('🧬 EvoTap Game Backend инициализирован');
    }

    setupRoutes() {
        // Главная страница
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/index.html'));
        });

        // Получить данные игрока
        this.app.get('/api/player/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const playerData = await this.getPlayerData(userId);
                res.json(playerData);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Обработка кликов/эволюции
        this.app.post('/api/evolve', async (req, res) => {
            try {
                const { userId, clicks = 1 } = req.body;
                const result = await this.processEvolution(userId, clicks);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Покупка органелл
        this.app.post('/api/buy-organelle', async (req, res) => {
            try {
                const { userId, organelleId } = req.body;
                const result = await this.buyOrganelle(userId, organelleId);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Разблокировка новой эры
        this.app.post('/api/unlock-era', async (req, res) => {
            try {
                const { userId, eraId } = req.body;
                const result = await this.unlockEra(userId, eraId);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Мутация (создание NFT)
        this.app.post('/api/mutate', async (req, res) => {
            try {
                const { userId, mutationType = 'random' } = req.body;
                const result = await this.createMutation(userId, mutationType);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Скрещивание организмов
        this.app.post('/api/breed', async (req, res) => {
            try {
                const { userId, organism1Id, organism2Id } = req.body;
                const result = await this.breedOrganisms(userId, organism1Id, organism2Id);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Получить информацию об эрах
        this.app.get('/api/eras', (req, res) => {
            res.json(this.eras);
        });

        // Получить органеллы
        this.app.get('/api/organelles', (req, res) => {
            res.json(this.organelles);
        });

        // Получить NFT игрока
        this.app.get('/api/nfts/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const nfts = await this.getUserNFTs(userId);
                res.json(nfts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Обмен ДНК на $DNA токены
        this.app.post('/api/exchange-dna', async (req, res) => {
            try {
                const { userId, dnaAmount } = req.body;
                const result = await this.exchangeDNAForTokens(userId, dnaAmount);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Лидерборд
        this.app.get('/api/leaderboard', async (req, res) => {
            try {
                const leaderboard = await this.getLeaderboard();
                res.json(leaderboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                game: 'EvoTap',
                timestamp: new Date().toISOString(),
                players: this.players.size,
                totalEvolutions: Array.from(this.players.values()).reduce((sum, p) => sum + p.totalClicks, 0)
            });
        });
    }

    async getPlayerData(userId) {
        if (!this.players.has(userId)) {
            // Создаем нового игрока
            this.players.set(userId, {
                id: userId,
                dna: 0,
                totalClicks: 0,
                currentEra: 1,
                unlockedEras: [1],
                organelles: [],
                organisms: [],
                achievements: [],
                lastClick: null,
                clicksPerSecond: 0,
                passiveIncome: 0,
                createdAt: new Date(),
                level: 1,
                experience: 0
            });
        }

        const player = this.players.get(userId);
        
        // Вычисляем пассивный доход
        const now = new Date();
        if (player.lastUpdate) {
            const timeDiff = (now - player.lastUpdate) / 1000; // секунды
            const passiveEarnings = Math.floor(player.passiveIncome * timeDiff);
            player.dna += passiveEarnings;
        }
        player.lastUpdate = now;

        // Получаем Web3 данные
        try {
            const tokenBalance = await Core.web3.getTokenBalance(userId);
            const userNFTs = await Core.web3.getUserNFTs(userId);
            
            player.tokenBalance = tokenBalance;
            player.nfts = userNFTs;
        } catch (error) {
            console.log('Web3 данные недоступны:', error.message);
            player.tokenBalance = 0;
            player.nfts = [];
        }

        return player;
    }

    async processEvolution(userId, clicks = 1) {
        const player = await this.getPlayerData(userId);
        const now = new Date();
        
        // Получаем текущую эру
        const currentEra = this.eras.find(era => era.id === player.currentEra);
        
        // Вычисляем множители
        let totalMultiplier = currentEra.multiplier;
        
        // Применяем бонусы от органелл
        player.organelles.forEach(organelleId => {
            const organelle = this.organelles.find(o => o.id === organelleId);
            if (organelle && organelle.multiplier) {
                totalMultiplier *= organelle.multiplier;
            }
        });

        // Начисляем ДНК
        const dnaEarned = clicks * totalMultiplier;
        player.dna += dnaEarned;
        player.totalClicks += clicks;
        player.experience += clicks;

        // Вычисляем уровень
        player.level = Math.floor(Math.sqrt(player.experience / 100)) + 1;

        // Вычисляем CPS
        if (player.lastClick) {
            const timeDiff = (now - player.lastClick) / 1000;
            player.clicksPerSecond = clicks / timeDiff;
        }
        player.lastClick = now;

        // Проверяем достижения
        const newAchievements = await this.checkAchievements(userId, player);

        // Автоматические клики от органелл
        let autoClicks = 0;
        player.organelles.forEach(organelleId => {
            const organelle = this.organelles.find(o => o.id === organelleId);
            if (organelle && organelle.autoClick) {
                autoClicks += organelle.autoClick;
            }
        });

        // Сохраняем данные
        try {
            await Core.database.savePlayerData(userId, player);
        } catch (error) {
            console.log('Ошибка сохранения в БД:', error.message);
        }

        return {
            success: true,
            dnaEarned,
            totalDNA: player.dna,
            level: player.level,
            currentEra: currentEra.name,
            autoClicks,
            newAchievements,
            player
        };
    }

    async buyOrganelle(userId, organelleId) {
        const player = await this.getPlayerData(userId);
        const organelle = this.organelles.find(o => o.id === organelleId);
        
        if (!organelle) {
            throw new Error('Органелла не найдена');
        }

        if (player.organelles.includes(organelleId)) {
            throw new Error('Органелла уже куплена');
        }

        if (player.dna < organelle.cost) {
            throw new Error('Недостаточно ДНК');
        }

        // Покупаем органеллу
        player.dna -= organelle.cost;
        player.organelles.push(organelleId);

        // Обновляем пассивный доход
        if (organelle.passive) {
            player.passiveIncome += organelle.passive;
        }

        await Core.database.savePlayerData(userId, player);

        return {
            success: true,
            organelle: organelle.name,
            remainingDNA: player.dna,
            effect: organelle.effect
        };
    }

    async unlockEra(userId, eraId) {
        const player = await this.getPlayerData(userId);
        const era = this.eras.find(e => e.id === eraId);
        
        if (!era) {
            throw new Error('Эра не найдена');
        }

        if (player.unlockedEras.includes(eraId)) {
            throw new Error('Эра уже разблокирована');
        }

        if (player.dna < era.unlockCost) {
            throw new Error('Недостаточно ДНК для разблокировки');
        }

        // Разблокируем эру
        player.dna -= era.unlockCost;
        player.unlockedEras.push(eraId);
        player.currentEra = eraId;

        // Проверяем достижения за эры
        const newAchievements = await this.checkAchievements(userId, player);

        await Core.database.savePlayerData(userId, player);

        return {
            success: true,
            unlockedEra: era.name,
            remainingDNA: player.dna,
            newAchievements
        };
    }

    async createMutation(userId, mutationType = 'random') {
        const player = await this.getPlayerData(userId);
        const mutationCost = 1000 * Math.pow(2, player.organisms.length);

        if (player.dna < mutationCost) {
            throw new Error('Недостаточно ДНК для мутации');
        }

        // Создаем случайный организм
        const organism = this.generateRandomOrganism(player.currentEra);
        
        // Списываем ДНК
        player.dna -= mutationCost;
        player.organisms.push(organism);

        // Создаем NFT
        try {
            const nftResult = await Core.web3.mintNFTReward(userId, organism.rarity, 'evotap');
            organism.nftId = nftResult.tokenId;
            console.log(`🧬 NFT организм "${organism.name}" создан для игрока ${userId}`);
        } catch (error) {
            console.log('Ошибка создания NFT:', error.message);
        }

        await Core.database.savePlayerData(userId, player);

        return {
            success: true,
            organism,
            cost: mutationCost,
            remainingDNA: player.dna
        };
    }

    generateRandomOrganism(era) {
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
        const rarityWeights = [50, 30, 15, 4, 1]; // Вероятности в %
        
        // Выбираем редкость
        const random = Math.random() * 100;
        let cumulativeWeight = 0;
        let rarity = 'Common';
        
        for (let i = 0; i < rarities.length; i++) {
            cumulativeWeight += rarityWeights[i];
            if (random <= cumulativeWeight) {
                rarity = rarities[i];
                break;
            }
        }

        // Генерируем трейты
        const traits = {};
        this.traits.forEach(trait => {
            const maxValue = rarity === 'Mythic' ? 4 : rarity === 'Legendary' ? 3 : rarity === 'Epic' ? 2 : rarity === 'Rare' ? 1 : 0;
            traits[trait.name] = trait.values[Math.min(maxValue, Math.floor(Math.random() * trait.values.length))];
        });

        // Генерируем имя
        const prefixes = ['Прото', 'Нео', 'Мега', 'Гипер', 'Ультра'];
        const suffixes = ['зоид', 'форма', 'бласт', 'цит', 'морф'];
        const name = prefixes[Math.floor(Math.random() * prefixes.length)] + 
                    suffixes[Math.floor(Math.random() * suffixes.length)];

        return {
            id: Date.now() + Math.random(),
            name,
            rarity,
            era,
            traits,
            power: this.calculatePower(traits, rarity),
            createdAt: new Date(),
            generation: 1,
            parents: []
        };
    }

    calculatePower(traits, rarity) {
        let power = 100;
        
        // Бонусы от трейтов
        Object.values(traits).forEach(traitValue => {
            if (traitValue.includes('Титанический') || traitValue.includes('Сверхразум')) power += 100;
            else if (traitValue.includes('Мощный') || traitValue.includes('Гениальный')) power += 50;
            else if (traitValue.includes('Сильный') || traitValue.includes('Умный')) power += 25;
        });

        // Бонус от редкости
        const rarityBonus = {
            'Common': 1,
            'Rare': 1.5,
            'Epic': 2,
            'Legendary': 3,
            'Mythic': 5
        };

        return Math.floor(power * rarityBonus[rarity]);
    }

    async breedOrganisms(userId, organism1Id, organism2Id) {
        const player = await this.getPlayerData(userId);
        const organism1 = player.organisms.find(o => o.id === organism1Id);
        const organism2 = player.organisms.find(o => o.id === organism2Id);

        if (!organism1 || !organism2) {
            throw new Error('Организм не найден');
        }

        const breedingCost = 5000;
        if (player.dna < breedingCost) {
            throw new Error('Недостаточно ДНК для скрещивания');
        }

        // Создаем гибрид
        const hybrid = this.createHybrid(organism1, organism2);
        
        player.dna -= breedingCost;
        player.organisms.push(hybrid);

        // Создаем NFT для гибрида
        try {
            const nftResult = await Core.web3.mintNFTReward(userId, hybrid.rarity, 'evotap');
            hybrid.nftId = nftResult.tokenId;
        } catch (error) {
            console.log('Ошибка создания NFT гибрида:', error.message);
        }

        await Core.database.savePlayerData(userId, player);

        return {
            success: true,
            hybrid,
            cost: breedingCost,
            remainingDNA: player.dna
        };
    }

    createHybrid(parent1, parent2) {
        // Наследуем трейты от родителей
        const traits = {};
        this.traits.forEach(trait => {
            // 30% от каждого родителя + 40% случайность
            const random = Math.random();
            if (random < 0.3) {
                traits[trait.name] = parent1.traits[trait.name];
            } else if (random < 0.6) {
                traits[trait.name] = parent2.traits[trait.name];
            } else {
                // Случайная мутация
                traits[trait.name] = trait.values[Math.floor(Math.random() * trait.values.length)];
            }
        });

        // Определяем редкость гибрида
        const parentRarities = [parent1.rarity, parent2.rarity];
        const rarityLevels = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4, 'Mythic': 5 };
        const avgRarityLevel = (rarityLevels[parent1.rarity] + rarityLevels[parent2.rarity]) / 2;
        const rarityNames = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
        const rarity = rarityNames[Math.min(4, Math.floor(avgRarityLevel))];

        return {
            id: Date.now() + Math.random(),
            name: `${parent1.name}-${parent2.name} Гибрид`,
            rarity,
            era: Math.max(parent1.era, parent2.era),
            traits,
            power: this.calculatePower(traits, rarity),
            createdAt: new Date(),
            generation: Math.max(parent1.generation, parent2.generation) + 1,
            parents: [parent1.id, parent2.id]
        };
    }

    async checkAchievements(userId, player) {
        const newAchievements = [];

        for (const achievement of this.achievements) {
            if (player.achievements.includes(achievement.id)) continue;

            let earned = false;

            switch (achievement.type) {
                case 'clicks':
                    earned = player.totalClicks >= achievement.requirement;
                    break;
                case 'era':
                    earned = player.unlockedEras.length >= achievement.requirement;
                    break;
                case 'nfts':
                    earned = player.organisms.length >= achievement.requirement;
                    break;
                case 'cps':
                    earned = player.clicksPerSecond >= achievement.requirement;
                    break;
            }

            if (earned) {
                player.achievements.push(achievement.id);
                player.dna += achievement.reward;
                newAchievements.push(achievement);

                // Создаем NFT достижение
                if (achievement.nft) {
                    try {
                        await Core.web3.mintNFTReward(userId, achievement.nft, 'evotap');
                        console.log(`🏆 NFT достижение "${achievement.nft}" выдано игроку ${userId}`);
                    } catch (error) {
                        console.log('Ошибка выдачи NFT достижения:', error.message);
                    }
                }

                // Уведомление в Telegram
                try {
                    await Core.telegram.sendAchievementNotification(userId, achievement);
                } catch (error) {
                    console.log('Ошибка отправки уведомления:', error.message);
                }
            }
        }

        return newAchievements;
    }

    async getUserNFTs(userId) {
        const player = await this.getPlayerData(userId);
        return player.organisms || [];
    }

    async exchangeDNAForTokens(userId, dnaAmount) {
        const player = await this.getPlayerData(userId);

        if (player.dna < dnaAmount) {
            throw new Error('Недостаточно ДНК');
        }

        // Курс: 100 ДНК = 1 $DNA токен
        const tokensToMint = Math.floor(dnaAmount / 100);

        if (tokensToMint === 0) {
            throw new Error('Минимум 100 ДНК для обмена');
        }

        player.dna -= dnaAmount;

        try {
            await Core.web3.mintTokenReward(userId, tokensToMint, 'evotap');
            console.log(`💰 ${tokensToMint} $DNA токенов выдано игроку ${userId}`);
        } catch (error) {
            player.dna += dnaAmount; // Возвращаем ДНК при ошибке
            throw new Error('Ошибка выдачи токенов: ' + error.message);
        }

        await Core.database.savePlayerData(userId, player);

        return {
            success: true,
            dnaUsed: dnaAmount,
            tokensReceived: tokensToMint,
            remainingDNA: player.dna
        };
    }

    async getLeaderboard() {
        const players = Array.from(this.players.values());
        
        // Топ по общему количеству кликов
        const topClicks = players
            .sort((a, b) => b.totalClicks - a.totalClicks)
            .slice(0, 10)
            .map((p, index) => ({
                rank: index + 1,
                id: p.id,
                totalClicks: p.totalClicks,
                era: this.eras.find(e => e.id === p.currentEra)?.name || 'Неизвестно'
            }));

        // Топ по уровню
        const topLevel = players
            .sort((a, b) => b.level - a.level)
            .slice(0, 10)
            .map((p, index) => ({
                rank: index + 1,
                id: p.id,
                level: p.level,
                experience: p.experience
            }));

        // Топ по количеству NFT
        const topNFTs = players
            .sort((a, b) => (b.organisms?.length || 0) - (a.organisms?.length || 0))
            .slice(0, 10)
            .map((p, index) => ({
                rank: index + 1,
                id: p.id,
                nfts: p.organisms?.length || 0,
                rarest: p.organisms?.find(o => o.rarity === 'Mythic') ? 'Mythic' : 
                       p.organisms?.find(o => o.rarity === 'Legendary') ? 'Legendary' : 'None'
            }));

        return {
            topClicks,
            topLevel,
            topNFTs,
            totalPlayers: players.length,
            totalEvolutions: players.reduce((sum, p) => sum + p.totalClicks, 0)
        };
    }

    async start() {
        await this.init();
        
        this.app.listen(this.port, () => {
            console.log(`🧬 EvoTap запущен на порту ${this.port}`);
            console.log(`🌐 Игра доступна: http://localhost:${this.port}`);
        });
    }
}

module.exports = EvoTapGame;

if (require.main === module) {
    const game = new EvoTapGame();
    game.start().catch(console.error);
} 