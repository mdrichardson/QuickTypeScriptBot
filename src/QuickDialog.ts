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
    DialogTurnStatus
 } from 'botbuilder-dialogs';
import { TurnContext, StatePropertyAccessor } from 'botbuilder';

const promptIds = {
    ATTACHMENT: 'attachmentPrompt',
    CHOICE: 'choicePrompt',
    CONFIRM: 'confirmPrompt',
    DATETIME: 'dateTimePrompt',
    NUMBER: 'numberPrompt',
    TEXT: 'textPrompt',
};

export class QuickDialog extends ComponentDialog {
    constructor() {
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

    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    private stepOne = async (step: WaterfallStepContext) => {
        await step.context.sendActivity('Beginning QuickDialog...');
        return await step.next();
    }

    private stepTwo = async (step: WaterfallStepContext) => {
        // await step.context.sendActivity(`You said ${step.result}`);
        return await step.next();
    }

    private end = async (step: WaterfallStepContext) => {
        return await step.endDialog();
    }
}
