const express = require('express');
const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');

// Load environment vars
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

// Create a Slack WebClient to call Slack APIs (like chat.postMessage)
const web = new WebClient(SLACK_BOT_TOKEN);

// Create a Slack Event Adapter to handle events and signature verification
const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);

const app = express();

// Mount the Slack events middleware at /slack/events
app.use('/slack/events', slackEvents.expressMiddleware());

// Handle the `emoji_changed` event
slackEvents.on('emoji_changed', async (event) => {
  try {
    // Slack provides "subtype" to distinguish add/remove/rename
    if (event.subtype === 'add') {
      // event.name => new emoji's name
      // event.value => image URL
      const newEmojiName = event.name;

      // Post message in the channel announcing the new emoji
      await web.chat.postMessage({
        channel: SLACK_CHANNEL,
        text: `A new emoji has been added: ${newEmojiName} :${newEmojiName}:`
      });
    }
  } catch (error) {
    console.error('Error handling emoji_changed event:', error);
  }
});

// Basic health check route
app.get('/', (req, res) => {
  res.send('Slack emoji logger is up and running!');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
