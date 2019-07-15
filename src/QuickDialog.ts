import { 
    AttachmentPrompt, 
    ChoicePrompt, 
    ComponentDialog, 
    ConfirmPrompt, 
    DateTimePrompt, 
    NumberPrompt,
    TextPrompt, 
    WaterfallDialog, 
    WaterfallStepContext, 
    DialogState, 
    DialogSet,
    DialogTurnStatus,
    DialogTurnResult
} from 'botbuilder-dialogs';
import { TurnContext, StatePropertyAccessor, CardFactory, MessageFactory } from 'botbuilder';

import * as cardJson from './adaptiveCard.json';

const promptIds = {
    ATTACHMENT: 'attachmentPrompt',
    CHOICE: 'choicePrompt',
    CONFIRM: 'confirmPrompt',
    DATETIME: 'dateTimePrompt',
    NUMBER: 'numberPrompt',
    TEXT: 'textPrompt',
};

export class QuickDialog extends ComponentDialog {
    public constructor() {
        super('QuickDialog');

        this.addDialog(new WaterfallDialog('QuickWaterfallDialog', [
            this.stepOne.bind(this),
            this.stepTwo.bind(this),
            this.end.bind(this),
        ]));

        this.addDialog(new ChoicePrompt(promptIds.CHOICE));
        this.addDialog(new TextPrompt(promptIds.TEXT));
        this.addDialog(new NumberPrompt(promptIds.NUMBER));
        this.addDialog(new DateTimePrompt(promptIds.DATETIME));
        this.addDialog(new ConfirmPrompt(promptIds.CONFIRM));
        this.addDialog(new AttachmentPrompt(promptIds.ATTACHMENT));
    }

    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>): Promise<void> {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    private async stepOne(step: WaterfallStepContext): Promise<DialogTurnResult> {
        await step.context.sendActivity('Beginning QuickDialog...');

        const card = CardFactory.adaptiveCard(cardJson);
        
        // return await step.prompt(promptIds.TEXT, {
        //     prompt: {
        //         text: 'waiting for user input...', // You can comment this out if you don't want to display any text. Still works.
        //         attachments: [card]
        //     }
        // });
        return await step.next();
    }

    private async stepTwo(step: WaterfallStepContext): Promise<DialogTurnResult> {
        // await step.context.sendActivity(`You said ${step.result}`);
        return await step.next();
    }

    private async end(step: WaterfallStepContext): Promise<DialogTurnResult> {
        return await step.endDialog();
    }
}
