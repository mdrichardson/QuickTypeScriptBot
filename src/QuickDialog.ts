import { AttachmentPrompt, ChoicePrompt, ComponentDialog, ConfirmPrompt, DateTimePrompt, NumberPrompt, TextPrompt, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';

const promptIds = {
    ATTACHMENT: 'attachmentPrompt',
    CHOICE: 'choicePrompt',
    CONFIRM: 'confirmPrompt',
    DATETIME: 'dateTimePrompt',
    NUMBER: 'numberPrompt',
    TEXT: 'textPrompt',
};

export class QuickDialog extends ComponentDialog {
    constructor(dialogId: string) {
        super(dialogId);

        this.addDialog(new WaterfallDialog(dialogId, [
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

    private stepOne = async (step: WaterfallStepContext) => {
        return await step.next();
    }

    private stepTwo = async (step: WaterfallStepContext) => {
        await step.context.sendActivity(`You said ${step.result}`);
        return await step.next();
    }

    private end = async (step: WaterfallStepContext) => {
        return await step.endDialog();
    }
}
