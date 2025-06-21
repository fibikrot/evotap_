const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// In-memory storage for production (можно заменить на базу данных)
let gameData = {
    players: {},
    leaderboard: {
        topClicks: [],
        topLevel: [],
        topNFTs: []
    },
    totalPlayers: 0,
    totalEvolutions: 0
};

// Конфигурация игры
const GAME_CONFIG = {
    eras: [
        {
            id: 'cellular',
            name: 'Клеточная эра',
            description: 'Начало жизни',
            requiredDNA: 0,
            clickMultiplier: 1
        },
        {
            id: 'multicellular',
            name: 'Многоклеточная эра',
            description: 'Сложные организмы',
            requiredDNA: 100,
            clickMultiplier: 2
        },
        {
            id: 'vertebrate',
            name: 'Эра позвоночных',
            description: 'Развитие позвоночника',
            requiredDNA: 500,
            clickMultiplier: 3
        },
        {
            id: 'mammal',
            name: 'Эра млекопитающих',
            description: 'Теплокровные существа',
            requiredDNA: 2000,
            clickMultiplier: 5
        },
        {
            id: 'space',
            name: 'Космическая эра',
            description: 'Покорение космоса',
            requiredDNA: 10000,
            clickMultiplier: 10
        }
    ],
    organelles: [
        { id: 'mitochondria', name: 'Митохондрии', cost: 10, dnaPerSecond: 1, description: 'Энергетические станции клетки' },
        { id: 'nucleus', name: 'Ядро', cost: 50, dnaPerSecond: 5, description: 'Центр управления клеткой' },
        { id: 'ribosome', name: 'Рибосомы', cost: 100, dnaPerSecond: 10, description: 'Фабрики белка' },
        { id: 'chloroplast', name: 'Хлоропласты', cost: 200, dnaPerSecond: 20, description: 'Солнечные батареи клетки' },
        { id: 'vacuole', name: 'Вакуоли', cost: 500, dnaPerSecond: 50, description: 'Хранилища клетки' }
    ],
    achievements: [
        { id: 'first_cell', name: 'Первая клетка', description: 'Совершите первый клик', reward: 'Bronze Cell NFT', points: 10 },
        { id: 'dna_collector', name: 'Сборщик ДНК', description: 'Накопите 100 ДНК', reward: 'DNA Collector NFT', points: 25 },
        { id: 'organelle_master', name: 'Мастер органелл', description: 'Купите 5 органелл', reward: 'Organelle Master NFT', points: 50 },
        { id: 'evolution_expert', name: 'Эксперт эволюции', description: 'Достигните 2-й эры', reward: 'Evolution Expert NFT', points: 100 }
    ]
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        game: 'EvoTap',
        timestamp: new Date().toISOString(),
        players: gameData.totalPlayers,
        totalEvolutions: gameData.totalEvolutions
    });
});

// Get player data
app.get('/api/player/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!gameData.players[userId]) {
        gameData.players[userId] = {
            id: userId,
            dna: 0,
            totalClicks: 0,
            currentEra: 0,
            organelles: {},
            achievements: [],
            level: 1,
            experience: 0,
            nfts: [],
            createdAt: new Date().toISOString()
        };
        gameData.totalPlayers++;
    }
    
    res.json(gameData.players[userId]);
});

// Evolution (click)
app.post('/api/evolve', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!gameData.players[userId]) {
        gameData.players[userId] = {
            id: userId,
            dna: 0,
            totalClicks: 0,
            currentEra: 0,
            organelles: {},
            achievements: [],
            level: 1,
            experience: 0,
            nfts: [],
            createdAt: new Date().toISOString()
        };
        gameData.totalPlayers++;
    }
    
    const player = gameData.players[userId];
    const currentEra = GAME_CONFIG.eras[player.currentEra];
    const dnaGained = currentEra.clickMultiplier;
    
    player.dna += dnaGained;
    player.totalClicks++;
    player.experience++;
    gameData.totalEvolutions++;
    
    // Level up logic
    const newLevel = Math.floor(player.experience / 10) + 1;
    if (newLevel > player.level) {
        player.level = newLevel;
    }
    
    // Check for achievements
    const newAchievements = [];
    if (player.totalClicks === 1 && !player.achievements.includes('first_cell')) {
        player.achievements.push('first_cell');
        player.nfts.push({ type: 'Bronze Cell NFT', earnedAt: new Date().toISOString() });
        newAchievements.push('Первая клетка');
    }
    
    if (player.dna >= 100 && !player.achievements.includes('dna_collector')) {
        player.achievements.push('dna_collector');
        player.nfts.push({ type: 'DNA Collector NFT', earnedAt: new Date().toISOString() });
        newAchievements.push('Сборщик ДНК');
    }
    
    res.json({
        success: true,
        dnaGained,
        totalDNA: player.dna,
        totalClicks: player.totalClicks,
        level: player.level,
        experience: player.experience,
        newAchievements
    });
});

// Buy organelle
app.post('/api/buy-organelle', (req, res) => {
    const { userId, organelleId } = req.body;
    
    if (!userId || !organelleId) {
        return res.status(400).json({ error: 'User ID and organelle ID required' });
    }
    
    const player = gameData.players[userId];
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }
    
    const organelle = GAME_CONFIG.organelles.find(o => o.id === organelleId);
    if (!organelle) {
        return res.status(404).json({ error: 'Organelle not found' });
    }
    
    const currentCount = player.organelles[organelleId] || 0;
    const cost = Math.floor(organelle.cost * Math.pow(1.15, currentCount));
    
    if (player.dna < cost) {
        return res.status(400).json({ error: 'Insufficient DNA' });
    }
    
    player.dna -= cost;
    player.organelles[organelleId] = currentCount + 1;
    
    res.json({
        success: true,
        organelle: organelle.name,
        count: player.organelles[organelleId],
        cost,
        remainingDNA: player.dna
    });
});

// Mutation
app.post('/api/mutate', (req, res) => {
    const { userId, organismName } = req.body;
    
    if (!userId || !organismName) {
        return res.status(400).json({ error: 'User ID and organism name required' });
    }
    
    const player = gameData.players[userId];
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }
    
    const cost = 1000;
    if (player.dna < cost) {
        return res.status(400).json({ error: 'Insufficient DNA for mutation' });
    }
    
    player.dna -= cost;
    player.nfts.push({
        type: 'Custom Organism NFT',
        name: organismName,
        earnedAt: new Date().toISOString()
    });
    
    res.json({
        success: true,
        organism: organismName,
        remainingDNA: player.dna,
        message: `Создан уникальный организм: ${organismName}`
    });
});

// Exchange DNA for tokens
app.post('/api/exchange-dna', (req, res) => {
    const { userId, dnaAmount } = req.body;
    
    if (!userId || !dnaAmount) {
        return res.status(400).json({ error: 'User ID and DNA amount required' });
    }
    
    if (dnaAmount < 100) {
        return res.status(400).json({ error: 'Минимум 100 ДНК для обмена' });
    }
    
    const player = gameData.players[userId];
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.dna < dnaAmount) {
        return res.status(400).json({ error: 'Insufficient DNA' });
    }
    
    player.dna -= dnaAmount;
    const tokensEarned = Math.floor(dnaAmount / 10);
    
    res.json({
        success: true,
        tokensEarned,
        remainingDNA: player.dna,
        message: `Получено ${tokensEarned} $DNA токенов`
    });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
    const players = Object.values(gameData.players);
    
    const topClicks = players
        .sort((a, b) => b.totalClicks - a.totalClicks)
        .slice(0, 10)
        .map((player, index) => ({
            rank: index + 1,
            userId: player.id,
            totalClicks: player.totalClicks,
            era: GAME_CONFIG.eras[player.currentEra]?.name || 'Клеточная эра'
        }));
    
    const topLevel = players
        .sort((a, b) => b.level - a.level || b.experience - a.experience)
        .slice(0, 10)
        .map((player, index) => ({
            rank: index + 1,
            userId: player.id,
            level: player.level,
            experience: player.experience
        }));
    
    const topNFTs = players
        .sort((a, b) => b.nfts.length - a.nfts.length)
        .slice(0, 10)
        .map((player, index) => ({
            rank: index + 1,
            userId: player.id,
            nftCount: player.nfts.length,
            rareNFTs: player.nfts.filter(nft => nft.type.includes('Custom')).length
        }));
    
    res.json({
        topClicks,
        topLevel,
        topNFTs,
        totalPlayers: gameData.totalPlayers,
        totalEvolutions: gameData.totalEvolutions
    });
});

// Game config
app.get('/api/config', (req, res) => {
    res.json(GAME_CONFIG);
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Health check for root
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        game: 'EvoTap',
        timestamp: new Date().toISOString(),
        players: gameData.totalPlayers,
        totalEvolutions: gameData.totalEvolutions
    });
});

// For Vercel serverless functions
if (process.env.NODE_ENV === 'production') {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`🧬 EvoTap запущен на порту ${PORT}`);
        console.log(`🌐 Игра доступна: http://localhost:${PORT}`);
    });
} 