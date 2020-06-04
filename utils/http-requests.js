const http = require('http');
const querystring = require('querystring');
const util = require('util');
const { url }= require('../config');

const request = ({ path, options = {method: 'GET'}, writeData }) => {
    const $url = `${url.API_BASE}${path}`;
    return new Promise((resolve, reject) => {
        const req = http.request($url, options, (res) => {
            const {statusCode} = res;
            res.setEncoding('utf8');
            let body = '';
            res.on('data', (data) => {
                body += data;
            });
            res.on('end', () => {
                body = JSON.parse(body);
                resolve({ body, statusCode });
            });
            res.on('error', (err) => reject(err));
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (writeData) {
            req.write(writeData);
        }

        req.end();
    });
};

const get = (path, token) => {
    return request({
        path,
        options: {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        },
    });
};

const post = (path, data) => {
    return request({
        path,
        options: {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        },
        writeData: JSON.stringify(data)
    });
};

module.exports = {
    get,
    post
};