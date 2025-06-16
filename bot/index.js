const venom = require('venom-bot');
const fetch = require('node-fetch');

venom
  .create({
    session: 'therapy-session',
    browserArgs: ['--no-sandbox'],
    headless: true,
    autoClose: false,
    updatesLog: true,
  })
  .then((client) => {
    client.onMessage(async (message) => {
      if (message.isGroupMsg && !message.fromMe) {
        try {
          const res = await fetch('http://n8n:5678/webhook/therapy-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupId: message.chatId,
              sender: message.sender?.pushname || 'Anonymous',
              message: message.body,
            }),
          });

          const text = await res.text(); // first read as text
          try {
            const data = JSON.parse(text);
            if (data.reply) {
             await client.sendText(message.chatId, data.reply);}
            }catch(err){
              console.error("Invalid Json from n8n")
            } 

          const data = await res.json();
          if (data.reply) {
            await client.sendText(message.chatId, data.reply);
          }
        } catch (err) {
          console.error('Error calling n8n:', err);
        }
      }
    });
  })
  .catch(console.error);
