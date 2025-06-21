/**
 * EvoTap Game Launcher
 * Простой запуск игры без зависимостей от Core системы
 */

const express = require('express');
const path = require('path');

console.log('🧬 Запуск EvoTap...');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Простое хранилище в памяти (для демо)
const players = new Map();
const organisms = new Map();

// Базовые данные
const ERAS = [
    { id: 1, name: 'Клеточная эра', emoji: '🦠', unlockCost: 0, multiplier: 1 },
    { id: 2, name: 'Многоклеточная эра', emoji: '🐛', unlockCost: 1000, multiplier: 2 },
    { id: 3, name: 'Эра животных', emoji: '🦕', unlockCost: 10000, multiplier: 5 },
    { id: 4, name: 'Эра разума', emoji: '🧠', unlockCost: 100000, multiplier: 10 },
    { id: 5, name: 'Космическая эра', emoji: '🚀', unlockCost: 1000000, multiplier: 20 }
];

const ORGANELLES = [
    { id: 1, name: 'Митохондрия', cost: 100, multiplier: 2, description: 'Увеличивает производство ДНК' },
    { id: 2, name: 'Рибосома', cost: 500, multiplier: 3, description: 'Ускоряет синтез белков' },
    { id: 3, name: 'Ядро', cost: 2000, multiplier: 5, description: 'Контролирует клеточные процессы' }
];

// Получить или создать игрока
function getPlayer(userId) {
    if (!players.has(userId)) {
        players.set(userId, {
            id: userId,
            dna: 0,
            totalClicks: 0,
            level: 1,
            experience: 0,
            currentEra: 1,
            organelles: [],
            achievements: [],
            createdAt: new Date(),
            lastActive: new Date()
        });
    }
    return players.get(userId);
}

// API Routes
app.get('/api/player/:userId', (req, res) => {
    try {
        const player = getPlayer(req.params.userId);
        player.lastActive = new Date();
        res.json(player);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения данных игрока' });
    }
});

app.post('/api/evolve', (req, res) => {
    try {
        const { userId } = req.body;
        const player = getPlayer(userId);
        
        player.dna += 1;
        player.totalClicks += 1;
        player.experience += 1;
        
        if (player.experience >= player.level * 100) {
            player.level += 1;
        }
        
        res.json({
            success: true,
            dna: player.dna,
            totalClicks: player.totalClicks,
            level: player.level,
            experience: player.experience
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка эволюции' });
    }
});

app.post('/api/buy-organelle', (req, res) => {
    try {
        const { userId, organelleId } = req.body;
        const player = getPlayer(userId);
        const organelle = ORGANELLES.find(o => o.id === organelleId);
        
        if (!organelle) {
            return res.status(400).json({ error: 'Органелла не найдена' });
        }
        
        if (player.dna < organelle.cost) {
            return res.status(400).json({ error: 'Недостаточно ДНК' });
        }
        
        player.dna -= organelle.cost;
        player.organelles.push({
            id: organelle.id,
            name: organelle.name,
            purchasedAt: new Date()
        });
        
        res.json({
            success: true,
            message: `Органелла ${organelle.name} приобретена`,
            remainingDNA: player.dna,
            organelles: player.organelles
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка покупки органеллы' });
    }
});

app.post('/api/mutate', (req, res) => {
    try {
        const { userId } = req.body;
        const player = getPlayer(userId);
        
        if (player.dna < 1000) {
            return res.status(400).json({ error: 'Минимум 1000 ДНК для мутации' });
        }
        
        // Создаем случайный организм
        const traits = ['Быстрый', 'Сильный', 'Умный', 'Адаптивный', 'Крупный'];
        const colors = ['Красный', 'Синий', 'Зеленый', 'Желтый', 'Фиолетовый'];
        const names = ['Протоцит', 'Гиперцит', 'Мегацит', 'Ультрацит', 'Суперцит'];
        
        const organism = {
            id: Date.now() + Math.random(),
            name: names[Math.floor(Math.random() * names.length)],
            rarity: 'Common',
            era: player.currentEra,
            traits: {
                speed: traits[Math.floor(Math.random() * traits.length)],
                strength: traits[Math.floor(Math.random() * traits.length)],
                intelligence: traits[Math.floor(Math.random() * traits.length)],
                color: colors[Math.floor(Math.random() * colors.length)]
            },
            power: Math.floor(Math.random() * 500) + 100,
            createdAt: new Date(),
            generation: 1,
            parents: []
        };
        
        organisms.set(organism.id, organism);
        player.dna -= 1000;
        
        res.json({
            success: true,
            organism: organism,
            remainingDNA: player.dna
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка мутации' });
    }
});

app.get('/api/eras', (req, res) => {
    res.json(ERAS);
});

app.get('/api/organelles', (req, res) => {
    res.json(ORGANELLES);
});

app.get('/api/nfts/:userId', (req, res) => {
    try {
        const userOrganisms = Array.from(organisms.values()).slice(0, 10);
        res.json(userOrganisms);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения NFT' });
    }
});

app.post('/api/exchange-dna', (req, res) => {
    try {
        const { userId, amount } = req.body;
        const player = getPlayer(userId);
        
        if (amount < 100) {
            return res.status(400).json({ error: 'Минимум 100 ДНК для обмена' });
        }
        
        if (player.dna < amount) {
            return res.status(400).json({ error: 'Недостаточно ДНК' });
        }
        
        const tokens = Math.floor(amount / 100);
        player.dna -= amount;
        
        res.json({
            success: true,
            message: `Обменяно ${amount} ДНК на ${tokens} токенов`,
            tokensReceived: tokens,
            remainingDNA: player.dna
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обмена' });
    }
});

app.get('/api/leaderboard', (req, res) => {
    try {
        const playersArray = Array.from(players.values());
        
        const topClicks = playersArray
            .sort((a, b) => b.totalClicks - a.totalClicks)
            .slice(0, 10)
            .map((player, index) => ({
                rank: index + 1,
                userId: player.id,
                totalClicks: player.totalClicks,
                era: ERAS.find(e => e.id === player.currentEra)?.name || 'Неизвестно'
            }));
        
        const topLevel = playersArray
            .sort((a, b) => b.level - a.level)
            .slice(0, 10)
            .map((player, index) => ({
                rank: index + 1,
                userId: player.id,
                level: player.level,
                experience: player.experience
            }));
        
        res.json({
            topClicks,
            topLevel,
            topNFTs: [],
            totalPlayers: players.size,
            totalEvolutions: Array.from(players.values()).reduce((sum, p) => sum + p.totalClicks, 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения лидерборда' });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        game: 'EvoTap',
        timestamp: new Date().toISOString(),
        players: players.size,
        totalEvolutions: Array.from(players.values()).reduce((sum, p) => sum + p.totalClicks, 0)
    });
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ EvoTap запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT} для игры`);
});

// Обработка выхода
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка EvoTap...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка EvoTap...');
    process.exit(0);
}); 