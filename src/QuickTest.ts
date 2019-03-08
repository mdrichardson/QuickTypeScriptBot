import { DialogContext } from 'botbuilder-dialogs';
import * as adaptiveCard from '../src/adaptiveCard.json';

export class QuickTest {

    public onWelcome = async (dc: DialogContext) => {
        await dc.context.sendActivity('Executing welcome test...');
        await dc.beginDialog('quickDialog');
        return;
    }

    public onMessage = async (dc: DialogContext) => {
        await dc.context.sendActivity('Executing on message test...');
        return;
    }
}
