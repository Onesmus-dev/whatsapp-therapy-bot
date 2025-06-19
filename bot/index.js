const venom = require('venom-bot');
const fetch = require('node-fetch');
const schedule = require('node-schedule');

// Nurse shift tracking
const nurseShifts = new Map();

venom.create({
  session: 'nurse-therapy',
  browserArgs: ['--no-sandbox'],
  headless: true,
  autoClose: false,
  updatesLog: true,
})
.then((client) => {
  // Start scheduled jobs
  initScheduledJobs(client);
  
  // Temporary groups tracker
  const tempGroups = new Map();
  
  client.onMessage(async (message) => {
    // Handle group messages
    if (message.isGroupMsg && message.body) {
      // Skip bot messages
      if (message.fromMe || message.body.startsWith('NurseBot:')) return;
      
      // Handle nurse commands
      if (message.body.startsWith('#NurseLife')) {
        return handleNurseCommand(client, message, tempGroups);
      }
      
      // Standard therapy processing
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
        
        const data = await response.json();
        if (data.reply) {
          await client.sendText(message.chatId, `NurseBot: ${data.reply}`);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }
    
    // Handle direct messages (shift registration)
    else if (!message.isGroupMsg && message.body) {
      if (message.body.startsWith('#shift')) {
        handleShiftRegistration(client, message);
      }
    }
  });
})
.catch(console.error);

// Handle nurse-specific commands
async function handleNurseCommand(client, message, tempGroups) {
  const command = message.body.split(' ')[1]?.toLowerCase();
  const content = message.body.split(' ').slice(2).join(' ');
  
  try {
    const response = await fetch('http://n8n:5678/webhook/nurse-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        content,
        senderId: message.sender.id,
        senderName: message.sender.pushname,
        groupId: message.chatId
      }),
    });
    
    const data = await response.json();
    
    if (data.action === 'createGroup') {
      // Create temporary WhatsApp group
      const group = await client.createGroup(
        `NurseSupport-${Date.now()}`,
        [message.sender.id, ...data.peers]
      );
      
      // Send initial message
      await client.sendText(group.id, data.message);
      
      // Track group for auto-cleanup
      tempGroups.set(group.id, {
        created: Date.now(),
        lastActivity: Date.now()
      });
    }
    else if (data.reply) {
      await client.sendText(message.chatId, `NurseBot: ${data.reply}`);
    }
    else if (data.file) {
      await client.sendFile(
        message.chatId,
        data.file.path,
        data.file.filename,
        data.file.caption
      );
    }
  } catch (err) {
    console.error('Nurse command error:', err);
  }
}

// Shift registration handler
function handleShiftRegistration(client, message) {
  const [, shift, date] = message.body.split(' ');
  nurseShifts.set(message.sender.id, { shift, date });
  
  client.sendText(message.sender.id, 
    `⏰ Shift registered! ${shift} shift on ${date}\n` + 
    `You'll receive your morning boost and end-of-shift reflection request.`
  );
}

// Initialize scheduled jobs
function initScheduledJobs(client) {
  // Morning motivation (6 AM daily)
  schedule.scheduleJob('0 6 * * *', async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    for (const [nurseId, shiftData] of nurseShifts.entries()) {
      if (shiftData.date === today) {
        const messages = [
          `🌞 Good morning! Your ${shiftData.shift} shift will be amazing because YOU'RE in it!`,
          `👑 Healthcare hero! Today's patients are lucky to have you on ${shiftData.shift} shift!`,
          `💪 Strength check: You survived nursing school - today's shift is no match for you!`
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        await client.sendText(nurseId, `NurseBot: ${randomMessage}`);
      }
    }
  });
  
  // End-of-shift reflection (8 PM daily)
  schedule.scheduleJob('0 20 * * *', async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    for (const [nurseId, shiftData] of nurseShifts.entries()) {
      if (shiftData.date === today) {
        await client.sendText(
          nurseId,
          '📝 Shift Reflection:\n' + 
          'How was your shift? Reply with:\n' + 
          '1. 1-10 rating\n' + 
          '2. One highlight\n' + 
          '3. Advice for tomorrow\'s nurses\n' +
          'Example: "7/10, Highlight: Comforted a scared patient, Advice: Check crash cart batteries"'
        );
      }
    }
  });
  
  // Weekly thank you (Friday 6 PM)
  schedule.scheduleJob('0 18 * * 5', async () => {
    const weekNurses = new Set();
    const now = new Date();
    
    // Collect all nurses who worked this week
    for (const [nurseId, shiftData] of nurseShifts.entries()) {
      const shiftDate = new Date(shiftData.date);
      if ((now - shiftDate) / (1000*60*60*24) <= 7) {
        weekNurses.add(nurseId);
      }
    }
    
    // Send thank you message
    for (const nurseId of weekNurses) {
      await client.sendText(
        nurseId,
        '🎉 Weekly Appreciation:\n' + 
        'Thank you for your incredible work this week!\n' + 
        'You\'ve made a real difference in countless lives.\n' +
        'Enjoy your well-deserved rest! ❤️'
      );
    }
  });
}