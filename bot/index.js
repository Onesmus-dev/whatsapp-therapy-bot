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
      // 1. Ensure this is a group message and has a body
      if (message.isGroupMsg && message.body) {
        // 2. Avoid replying to your own messages or bot's replies
        if (message.fromMe || message.body.startsWith('Bot:')) return;

        try {
          const response = await fetch('http://n8n:5678/webhook/therapy-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupId: message.chatId,
              sender: message.sender?.pushname || 'Anonymous',
              message: message.body,
            }),
          });

          const text = await response.text();

          // 3. Try parsing the JSON
          try {
            const data = JSON.parse(text);
            if (data.reply) {
              await client.sendText(message.chatId, `Bot: ${data.reply}`);
            } else {
              console.log('No "reply" key in n8n response:', data);
            }
          } catch (parseErr) {
            console.error('Invalid JSON from n8n:', text);
          }
        } catch (err) {
          console.error('Error calling n8n:', err);
        }
      }
    });
  })
  .catch(console.error);
