// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, StatePropertyAccessor, UserState, ActivityHandler } from 'botbuilder';
import { DialogState, Dialog } from 'botbuilder-dialogs';

import * as ActivityTester from './ActivityTester';

export class MyBot extends ActivityHandler {

    private conversationState: ConversationState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;
    private userState: UserState;

    public constructor(conversationState: ConversationState, userState: UserState, dialog: Dialog) {
        super();

        this.dialogState = conversationState.createProperty('DialogState');
        this.conversationState = conversationState;
        this.userState = userState;

        this.dialog = dialog;

        this.onConversationUpdate(async (context, next): Promise<void> => { await ActivityTester.onConversationUpdate(context, this.dialog, this.dialogState); await next(); });
        this.onDialog(async (context, next): Promise<void> => { await ActivityTester.onDialog(context, this.dialog, this.dialogState); await next(); });
        this.onEvent(async (context, next): Promise<void> => { await ActivityTester.onEvent(context, this.dialog, this.dialogState); await next(); });
        this.onMembersAdded(async (context, next): Promise<void> => { await ActivityTester.onMembersAdded(context, this.dialog, this.dialogState); await next(); });
        this.onMembersRemoved(async (context, next): Promise<void> => { await ActivityTester.onMembersRemoved(context, this.dialog, this.dialogState); await next(); });
        this.onMessage(async (context, next): Promise<void> => { await ActivityTester.onMessage(context, this.dialog, this.dialogState); await next(); });
        this.onTokenResponseEvent(async (context, next): Promise<void> => { await ActivityTester.onTokenResponseEvent(context, this.dialog, this.dialogState); await next(); });
        this.onUnrecognizedActivityType(async (context, next): Promise<void> => { await ActivityTester.onUnrecognizedActivityType(context, this.dialog, this.dialogState); await next(); });

        this.onTurn(async (turnContext, next): Promise<void> => {

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
