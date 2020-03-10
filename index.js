const express = require('express'),
    BodyParser = require('body-parser'),
    {Botact} = require('botact'),
    mongoose = require("mongoose"),
    server = express(),
    bot = new Botact({
        token: 'e5100c829eadf1102b0ecafcc47e0ca90f16f8b3f8c7193dc3899be1d7f0f7a938437bfcb8f79bd6f982b',
        confirmation: 'c03cd5c9'
    });

mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
},() => console.log("Mongoose connected"));

server.use(BodyParser.json());
server.post('/', bot.listen);
server.get('/', (req, res) => {
    res.end("Hello")
});

bot.on(({sendMessage, reply, body, user_id}) => {
    reply(body);
});
bot.on(ctx => bot.reply(ctx.user_id, ctx.body));
bot.hears(/(dz|дз)/i, ({reply, user_id}) => {
    reply("Дз не будет (бот принял ислам)")
});

server.listen(process.env.PORT || 80, () => console.log("Server is working on port: 80"));

