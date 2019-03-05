// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, StatePropertyAccessor, TurnContext } from 'botbuilder';
import { DialogSet, DialogState, DialogTurnStatus } from 'botbuilder-dialogs';

import { QuickDialog } from './QuickDialog';
import { QuickTest } from './QuickTest';

const DIALOG_STATE_PROPERTY = 'dialogState';
const QUICK_DIALOG_ID = 'quickDialog';

export class MyBot {

    private readonly dialogs: DialogSet;
    private conversationState: ConversationState;
    private dialogState: StatePropertyAccessor<DialogState>;
    private quickTest: QuickTest;

    constructor(conversationState: ConversationState) {
        if (!conversationState) { throw new Error('Need to provide conversation state when calling bot'); }

        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.conversationState = conversationState;

        this.dialogs = new DialogSet(this.dialogState)
            .add(new QuickDialog(QUICK_DIALOG_ID));

        this.quickTest = new QuickTest();
    }
    /**
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} turnContext context object.
     */
    public onTurn = async (turnContext: TurnContext) => {
        const dc = await this.dialogs.createContext(turnContext);

        const dialogResult = await dc.continueDialog();

        if (!dc.context.responded) {
            switch (dialogResult.status) {
                case DialogTurnStatus.complete:
                    await dc.endDialog();
                    break;
                case DialogTurnStatus.empty:
                case DialogTurnStatus.waiting:
                default:
                    await dc.cancelAllDialogs();
                    break;
            }
        }

        if (turnContext.activity.type === ActivityTypes.Message) {
            // Ensure that message is a postBack (like a submission from Adaptive Cards
            if (dc.context.activity.channelData.postback) {
                const activity = dc.context.activity;
                // Convert the user's Adaptive Card input into the input of a Text Prompt
                // Must be sent as a string
                activity.text = JSON.stringify(activity.value);
                dc.context.sendActivity(activity);
            } else {
                await this.quickTest.onMessage(dc);
            }
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            if (turnContext.activity.membersAdded.length !== 0) {
                for (const idx in turnContext.activity.membersAdded) {
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        await this.quickTest.onWelcome(dc);
                    }
                }
            }
        }

        await this.conversationState.saveChanges(turnContext);
    }
}
