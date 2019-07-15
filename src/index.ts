// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';
import * as restify from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState } from 'botbuilder';

// This bot's main dialog.
import { MyBot } from './bot';
import { QuickDialog } from './QuickDialog';

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: ENV_FILE });

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.

const adapter = new BotFrameworkAdapter({
    appId: process.env.UseCredentials === "true" ? process.env.MicrosoftAppID : '',
    appPassword: process.env.UseCredentials === "true" ? process.env.MicrosoftAppPassword : ''
});

const dataStorage = new MemoryStorage();

const conversationState = new ConversationState(dataStorage);
const userState = new UserState(dataStorage);

// Catch-all for errors.
adapter.onTurnError = async (context, error): Promise<void> => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
};

// Create the main dialog.
const dialog = new QuickDialog();
const myBot = new MyBot(conversationState, userState, dialog);

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, (): void => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nOpen in Emulator: bfemulator://livechat.open?botUrl=http%3A%2F%2Flocalhost%3A3978%2Fapi%2Fmessage`);
    console.log(`\nSee https://aka.ms/connect-to-bot for more information`);
});

// Listen for incoming requests.
server.post('/api/messages', (req, res): void => {
    adapter.processActivity(req, res, async (context): Promise<void> => {
        // Route to main dialog.
        await myBot.run(context);
    });
});
