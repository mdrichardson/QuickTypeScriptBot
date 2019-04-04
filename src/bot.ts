// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, StatePropertyAccessor, UserState, ActivityHandler } from 'botbuilder';
import { DialogState, Dialog } from 'botbuilder-dialogs';

import { ActivityTester } from './ActivityTester';

export class MyBot extends ActivityHandler {

    private conversationState: ConversationState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;
    private activityTester: ActivityTester;
    private userState: UserState;

    constructor(conversationState: ConversationState, userState: UserState, dialog: Dialog) {
        super();

        this.dialogState = conversationState.createProperty('DialogState');
        this.conversationState = conversationState;
        this.userState = userState;

        this.dialog = dialog;

        this.activityTester = new ActivityTester(this.dialog, this.dialogState);

        this.onConversationUpdate(async (turnContext, next) => { await this.activityTester.onConversationUpdate(turnContext); await next(); });
        this.onDialog(async (turnContext, next) => { await this.activityTester.onDialog(turnContext); await next(); });
        this.onEvent(async (turnContext, next) => { await this.activityTester.onEvent(turnContext); await next(); });
        this.onMembersAdded(async (turnContext, next) => { await this.activityTester.onMembersAdded(turnContext); await next(); });
        this.onMembersRemoved(async (turnContext, next) => { await this.activityTester.onMembersRemoved(turnContext); await next(); });
        this.onMessage(async (turnContext, next) => { await this.activityTester.onMessage(turnContext); await next(); });
        this.onTokenResponseEvent(async (turnContext, next) => { await this.activityTester.onTokenResponseEvent(turnContext); await next(); });
        this.onUnrecognizedActivityType(async (turnContext, next) => { await this.activityTester.onUnrecognizedActivityType(turnContext); await next(); });

        this.onTurn(async (turnContext, next) => {

            if (turnContext.activity.type === ActivityTypes.Message) {
                // Ensure that message is a postBack (like a submission from Adaptive Cards
                if (turnContext.activity.channelData.postback) {
                    const activity = turnContext.activity;
                    // Convert the user's Adaptive Card input into the input of a Text Prompt
                    // Must be sent as a string
                    activity.text = JSON.stringify(activity.value);
                    await turnContext.sendActivity(activity);
                }
            }

            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);
            await next();
        });
    }
}
