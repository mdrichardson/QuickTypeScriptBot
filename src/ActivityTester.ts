
import { TurnContext, StatePropertyAccessor } from 'botbuilder';
const chalk = require('chalk');
import { Dialog, DialogState } from 'botbuilder-dialogs';

import { QuickDialog } from './QuickDialog';

//
// FREQUENTLY USED
//

export async function onMembersAdded (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    const membersAdded = context.activity.membersAdded;
    for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
            await notifyOfActivity('onMembersAdded', context);
            await (dialog as QuickDialog).run(context, dialogState)
        }
    }
    return;
}

export async function onMessage (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    await notifyOfActivity('onMessage', context);
    return;
}

//
// RARELY USED
//

export async function onConversationUpdate (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onConversationUpdate', context);
    return;
}

export async function onDialog (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onDialog', context);
    return;
}

export async function onEvent (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onEvent', context);
    return;
}


export async function onMembersRemoved (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onMembersRemoved', context);
    return;
}

export async function onTokenResponseEvent (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onTokenResponseEvent', context);
    return;
}

export async function onUnrecognizedActivityType (context: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onUnrecognizedActivityType', context);
    return;
}

async function notifyOfActivity (activity: string, context: TurnContext) {
    await context.sendActivity(`**Activity [${activity}] has fired**`);
    console.log(`\nActivity [${chalk.blue(activity)}] has fired`);
}
