
import { TurnContext, StatePropertyAccessor } from 'botbuilder';
const chalk = require('chalk');
import { Dialog, DialogState } from 'botbuilder-dialogs';

import { QuickDialog } from './QuickDialog';

export class ActivityTester {
    private dialog: Dialog;
    dialogState: StatePropertyAccessor<DialogState>;

    constructor(dialog: Dialog, dialogState: StatePropertyAccessor<DialogState>) {
        this.dialog = dialog;
        this.dialogState = dialogState;
    }

    //
    // FREQUENTLY USED
    //

    public onMembersAdded = async (turnContext: TurnContext) => {
        await this.notifyOfActivity('onMembersAdded', turnContext);
        return;
    }

    public onMessage = async (turnContext: TurnContext) => {
        await this.notifyOfActivity('onMessage', turnContext);
        await (this.dialog as QuickDialog).run(turnContext, this.dialogState)
        return;
    }

    //
    // RARELY USED
    //

    public onConversationUpdate = async (turnContext: TurnContext) => {
        // await this.notifyOfActivity('onConversationUpdate', turnContext);
        return;
    }

    public onDialog = async (turnContext: TurnContext) => {
        // await this.notifyOfActivity('onDialog', turnContext);
        return;
    }

    public onEvent = async (turnContext: TurnContext) => {
        // await this.notifyOfActivity('onEvent', turnContext);
        return;
    }

    
    public onMembersRemoved = async (turnContext: TurnContext) => {
        // await this.notifyOfActivity('onMembersRemoved', turnContext);
        return;
    }

    public onTokenResponseEvent = async (turnContext: TurnContext) => {
        // await this.notifyOfActivity('onTokenResponseEvent', turnContext);
        return;
    }

    public onUnrecognizedActivityType = async (turnContext: TurnContext) => {
        // await this.notifyOfActivity('onUnrecognizedActivityType', turnContext);
        return;
    }

    private notifyOfActivity = async (activity: string, turnContext: TurnContext) => {
        await turnContext.sendActivity(`**Activity [${activity}] has fired**`);
        console.log(`\nActivity [${chalk.blue(activity)}] has fired`);
    }
}
