import { DialogContext } from 'botbuilder-dialogs';

export class QuickTest {

    public onWelcome = async (dc: DialogContext) => {
        await dc.context.sendActivity('Executing welcome test...');
        return;
    }

    public onMessage = async (dc: DialogContext) => {
        await dc.context.sendActivity('Executing on message test...');
        return;
    }
}
