const express = require ('express');
const BodyParser = require ('body-parser');
const { Botact } = require ('botact');


const server = express ();
const bot = new Botact({
    token: 'e5100c829eadf1102b0ecafcc47e0ca90f16f8b3f8c7193dc3899be1d7f0f7a938437bfcb8f79bd6f982b',
    confirmation: 'c03cd5c9'
});

bot.on(ctx => bot.reply(ctx.user_id, ctx.body));

server.use(BodyParser.json());

server.post('/', bot.listen);

server.get("/", (_,res) => res.send("hello world!"));

server.listen(process.env.PORT, () => console.log("Server is working on port: 80"));