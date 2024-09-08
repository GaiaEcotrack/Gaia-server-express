const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Credenciales predeterminadas
const defaultUsername = process.env.ADMIN_USER;
const defaultPassword = process.env.ADMIN_PASSWORD;

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Verifica las credenciales predeterminadas
    if (username !== defaultUsername || password !== defaultPassword) {
        return res.status(401).send('Invalid credentials');
    }

    // Crea un token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

module.exports = router;
