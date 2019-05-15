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
    DialogTurnResult,
    PromptOptions,
    PromptValidatorContext,
    PromptValidator
} from 'botbuilder-dialogs';
import { TurnContext, StatePropertyAccessor, CardFactory } from 'botbuilder';
import { AdaptiveCardPrompt } from './AdaptiveCardPrompt';

import * as cardJson from './adaptiveCard.json';

const promptIds = {
    ADAPTIVE: 'adaptivePrompt',
    ADAPTIVEDialog: 'adaptivePromptDialog',
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

        const card = CardFactory.adaptiveCard(cardJson);

        this.addDialog(new ChoicePrompt(promptIds.CHOICE));
        this.addDialog(new TextPrompt(promptIds.TEXT));
        this.addDialog(new NumberPrompt(promptIds.NUMBER));
        this.addDialog(new DateTimePrompt(promptIds.DATETIME));
        this.addDialog(new ConfirmPrompt(promptIds.CONFIRM));
        this.addDialog(new AttachmentPrompt(promptIds.ATTACHMENT));
        this.addDialog(new AdaptiveCardPrompt(promptIds.ADAPTIVE, null, {
            requiredInputIds: ['textInput']
        }));

        this.initialDialogId = 'QuickWaterfallDialog';
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
        // await step.context.sendActivity('Beginning QuickDialog...');
        const card = CardFactory.adaptiveCard(cardJson);
        const options: PromptOptions = {
            prompt: { attachments: [card] },
            retryPrompt: { attachments: [card] },
        };
        return await step.prompt(promptIds.ADAPTIVE, options);
        // return await step.beginDialog(promptIds.ADAPTIVEDialog);
    }

    private async stepTwo(step: WaterfallStepContext): Promise<DialogTurnResult> {
        await step.context.sendActivity(`You said ${ step.result }`);
        return await step.next();
    }

    private async end(step: WaterfallStepContext): Promise<DialogTurnResult> {
        return await step.endDialog();
    }

    private async validate(promptContext: PromptValidatorContext<object>): Promise<boolean> {
        if (promptContext.recognized.value['textInput'] === 'asdf') {
            return true;
        }
        return false;
    }
}
