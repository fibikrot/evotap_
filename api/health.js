module.exports = (req, res) => {
    res.json({
        status: 'OK',
        game: 'EvoTap',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
}; 