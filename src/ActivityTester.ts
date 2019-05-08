/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */

import { TurnContext, StatePropertyAccessor, ActivityTypes, MessageFactory } from 'botbuilder';
import chalk from 'chalk';
import { Dialog, DialogState } from 'botbuilder-dialogs';
import { Activity } from 'botbuilder';

import { QuickDialog } from './QuickDialog';

//
// FREQUENTLY USED
//

export async function onMembersAdded(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    const membersAdded = context.activity.membersAdded;
    for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        const message = MessageFactory.text('');
        const disable = {
            type: ActivityTypes.Event,
            value: { chatBox: 'disable' }
        };
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
            await notifyOfActivity('onMembersAdded', context);
            const disable: Partial<Activity> = {
                type: ActivityTypes.Event,
                value: { chatBox: 'disable' }
            };
            // const enable: Partial<Activity> = {
            //     type: ActivityTypes.Event,
            //     value: { chatBox: 'enable' }
            // };
            const enable = MessageFactory.suggestedActions([ 'A', 'B', 'C'], 'Pick');
            enable.channelData = { chatBox: 'enable' };
            // const disable = prompt('test prompt');
            while (true) {
                // await context.sendActivity(disable);
                // await new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, 3000));
                await context.sendActivity(enable);
                await new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, 3000));
            }
        }
    }
    return;
}

export async function onMessage(context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>): Promise<void> {
    await notifyOfActivity('onMessage', context);
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
