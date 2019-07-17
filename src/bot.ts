// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, StatePropertyAccessor, UserState, ActivityHandler, TurnContext } from 'botbuilder';
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
        this.onDialog(async (context, next): Promise<void> => { 
            await ActivityTester.onDialog(context, this.dialog, this.dialogState); 
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next(); 
        });
        this.onEvent(async (context, next): Promise<void> => { await ActivityTester.onEvent(context, this.dialog, this.dialogState); await next(); });
        this.onMembersAdded(async (context, next): Promise<void> => { await ActivityTester.onMembersAdded(context, this.dialog, this.dialogState); await next(); });
        this.onMembersRemoved(async (context, next): Promise<void> => { await ActivityTester.onMembersRemoved(context, this.dialog, this.dialogState); await next(); });
        this.onTokenResponseEvent(async (context, next): Promise<void> => { await ActivityTester.onTokenResponseEvent(context, this.dialog, this.dialogState); await next(); });
        this.onUnrecognizedActivityType(async (context, next): Promise<void> => { await ActivityTester.onUnrecognizedActivityType(context, this.dialog, this.dialogState); await next(); });
        this.onMessage(async (context, next): Promise<void> => { 
            if (!context.activity.text && context.activity.value) {
                context.activity.text = context.activity.value;
            }

            await ActivityTester.onMessage(context, this.dialog, this.dialogState); 
            await next();
        });

        this.onTurn(async (turnContext, next): Promise<void> => {
            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);
            await next();
        });
    }
}
