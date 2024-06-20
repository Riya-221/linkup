const jwt = require('jsonwebtoken');
const users= require("../models/userModel") ;



const authenticateUser = async(req, res, next) => {
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
    // if (!token) return res.sendStatus(401);

    // jwt.verify(token, process.env.ACCESSTOKENSECRET, (err, user) => {
    //     if (err) {
    //         if (err.name === 'TokenExpiredError') {
    //             return res.status(401).json({ msg: 'TokenExpired' });
    //         }
    //         return res.sendStatus(403);
    //     }
    //     req.user = user;
    //     next();
    // });
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.ACCESSTOKENSECRET);
            req.user = await users.findById(decoded.id);
            // console.log('User authenticated:', req.user);
        } catch (err) {
            console.error('Error verifying token:', err);
        }
    } else {
        console.log('No token provided');
    }
    next();
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
    // if (!token) return res.sendStatus(401);

    // jwt.verify(token, process.env.ACCESSTOKENSECRET, async (err, user) => {
    //     if (err) {
    //         if (err.name === 'TokenExpiredError') {
    //             // Attempt to refresh token
    //             const refreshToken = req.cookies.refreshtoken;
    //             if (!refreshToken) return res.status(401).json({ msg: 'RefreshTokenRequired' });

    //             jwt.verify(refreshToken, process.env.REFRESHTOKENSECRET, async (err, decoded) => {
    //                 if (err) return res.status(403).json({ msg: 'InvalidRefreshToken' });

    //                 const newAccessToken = jwt.sign({ id: decoded.id }, process.env.ACCESSTOKENSECRET, { expiresIn: '1h' });
    //                 res.cookie('token', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    //                 req.user = await users.findById(decoded.id);
    //                 next();
    //             });
    //         } else {
    //             // console.log("errorrr") ;
    //             return res.sendStatus(403);
    //         }
    //     } else {
    //         req.user = await users.findById(user.id);
    //         next();
    //     }
    // });
};

module.exports = authenticateUser;