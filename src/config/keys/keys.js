const fs = require('fs');
const path = require('path');

//Llaves EC
const privateKeyEC = fs.readFileSync(path.join(__dirname, 'ECkeys', 'ec_private.pem'), 'utf8');
const publicKeyEC = fs.readFileSync(path.join(__dirname, 'ECkeys', 'ec_public.pem'), 'utf8');

//laves RSA
const privateKeyRSA = fs.readFileSync(path.join(__dirname, 'RSAkeys', 'private.key'), 'utf8');
const publicKeyRSA = fs.readFileSync(path.join(__dirname, 'RSAkeys', 'public.key'), 'utf8');


module.exports = {
    privateKeyEC,
    publicKeyEC,
    privateKeyRSA,
    publicKeyRSA,
};