
import { TurnContext, StatePropertyAccessor } from 'botbuilder';
const chalk = require('chalk');
import { Dialog, DialogState } from 'botbuilder-dialogs';

import { QuickDialog } from './QuickDialog';

//
// FREQUENTLY USED
//

export async function onMembersAdded (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    const membersAdded = turnContext.activity.membersAdded;
    for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== turnContext.activity.recipient.id) {
            await notifyOfActivity('onMembersAdded', turnContext);
            await (dialog as QuickDialog).run(turnContext, dialogState)
        }
    }
    return;
}

export async function onMessage (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    await notifyOfActivity('onMessage', turnContext);
    return;
}

//
// RARELY USED
//

export async function onConversationUpdate (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onConversationUpdate', turnContext);
    return;
}

export async function onDialog (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onDialog', turnContext);
    return;
}

export async function onEvent (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onEvent', turnContext);
    return;
}


export async function onMembersRemoved (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onMembersRemoved', turnContext);
    return;
}

export async function onTokenResponseEvent (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onTokenResponseEvent', turnContext);
    return;
}

export async function onUnrecognizedActivityType (turnContext: TurnContext, dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
    // await notifyOfActivity('onUnrecognizedActivityType', turnContext);
    return;
}

async function notifyOfActivity (activity: string, turnContext: TurnContext) {
    await turnContext.sendActivity(`**Activity [${activity}] has fired**`);
    console.log(`\nActivity [${chalk.blue(activity)}] has fired`);
}
