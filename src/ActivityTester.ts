/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */

import { TurnContext, StatePropertyAccessor } from 'botbuilder';
import chalk from 'chalk';
import { Dialog, DialogState } from 'botbuilder-dialogs';

import { QuickDialog } from './QuickDialog';

//
// FREQUENTLY USED
//

export async function onMembersAdded(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    const membersAdded = context.activity.membersAdded;
    for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
            await notifyOfActivity('onMembersAdded', context);
        }
    }
    return;
}

export async function onMessage(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    await notifyOfActivity('onMessage', context);
    await (dialog as QuickDialog).run(context, dialogState);
    return;
}

//
// RARELY USED
//

export async function onConversationUpdate(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    // await notifyOfActivity('onConversationUpdate', context);
    return;
}

export async function onDialog(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    // await notifyOfActivity('onDialog', context);
    return;
}

export async function onEvent(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    // await notifyOfActivity('onEvent', context);
    return;
}


export async function onMembersRemoved(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    // await notifyOfActivity('onMembersRemoved', context);
    return;
}

export async function onTokenResponseEvent(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    // await notifyOfActivity('onTokenResponseEvent', context);
    return;
}

export async function onUnrecognizedActivityType(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    // await notifyOfActivity('onUnrecognizedActivityType', context);
    return;
}

async function notifyOfActivity(activity: string, context: TurnContext): Promise<void> {
    await context.sendActivity(`**Activity [${ activity }] has fired**`);
    console.log(`\nActivity [${ chalk.blue(activity) }] has fired`);
}
