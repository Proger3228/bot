const Express = require('express');
const BodyParser = require('body-parser');
const { Botact } = require('botact');


const Server = express ();
const Bot = new Botact({
    token: '70306c7181f649b750ceacfe99520e60a8c691b1b4d920fe746d5362de5615aa245c674becf42ca038ae6',
    Confirmation: 'cec5c527'
});

Bot.on(function(ctx) {
    Console.log(ctx.body)             //учим бота, тут писать, что он будет делать
});

Server.use(BodyParser.json());

Server.post('/', bot.listen);   //путь к серверу, функция бота

Server.listen(80); //порт на котором сервер запущен