# whatsapp-therapy-bot
This project is a group therapy chatbot built using venom-bot, n8n for workflow automation, and Cohere as the language model. 
🧠 WhatsApp Therapy Bot 🤖
This project is a group therapy chatbot built using venom-bot, n8n for workflow automation, and Cohere as the language model. The bot runs inside a Dockerized environment and listens to messages in WhatsApp groups, intelligently generating empathetic responses through AI.
---
## 🚀 Features
Listens to WhatsApp group messages using venom-bot

Sends messages to an n8n webhook for processing

Uses Cohere's language model to generate responses

Sends the reply back to the group automatically

Fully containerized using Docker
---
## 🧩 Tech Stack
venom-bot – WhatsApp automation

n8n – Workflow orchestration and API handling

Cohere – Natural language processing

Docker – Isolated multi-container setup
---
## 🛠 How It Works
User sends a message in a WhatsApp group.

The bot captures it and sends it to n8n via a webhook.

n8n processes the message and calls Cohere's generate API.

The AI response is returned to the bot, which posts it back to the group.
---

## 📦 Setup
Clone the repo

Configure environment variables for Cohere and n8n

Start containers using docker-compose

Scan QR code to authorize WhatsApp bot

Add the bot to your group