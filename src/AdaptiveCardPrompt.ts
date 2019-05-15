import { PromptValidator, DialogContext, PromptOptions, DialogTurnResult, Prompt, PromptRecognizerResult, Dialog } from "botbuilder-dialogs";
import { InputHints, TurnContext, Activity, ActionTypes } from "botbuilder";

export class AdaptiveCardPrompt extends Prompt<object> {
    private _validator: PromptValidator<object>;
    private _inputFailMessage: string = 'Please fill out the Adaptive Card';

    public constructor(dialogId: string, validator?: PromptValidator<object>, inputFailMessage?: string) {
        super(dialogId, validator);
        
        this._validator = validator;
        this._inputFailMessage = inputFailMessage;
    }

    public set inputFailMessage(newMessage: string|null) {
        this._inputFailMessage = newMessage;
    }

    protected async onPrompt(context: TurnContext, state: object, options: PromptOptions, isRetry: boolean): Promise<void> {        
        this.validatePromptContainsCard(options, isRetry);

        const prompt = isRetry && options.retryPrompt ? options.retryPrompt : options.prompt;
        await context.sendActivity(prompt, undefined, InputHints.ExpectingInput);
    }

    protected async onRecognize(context: TurnContext): Promise<PromptRecognizerResult<object>> {
        // Ignore user input that doesn't come from adaptive card
        if (context.activity.channelData && context.activity.channelData[ActionTypes.PostBack]) {
            return { succeeded: true, value: context.activity.value };
        } else {
            return { succeeded: false };
        }
    }

    // Override continueDialog so that we can catch activity.value (which is ignored for prompts, by default)
    public async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Validate the return value
        const state: PromptState = dc.activeDialog.state as PromptState;
        const recognized: PromptRecognizerResult<object> = await this.onRecognize(dc.context);

        let isValid = false;
        if (this._validator && recognized.succeeded) {
            if (state.state['attemptCount'] === undefined) {
                state.state['attemptCount'] = 1;
            }
            isValid = await this._validator({
                context: dc.context,
                recognized: recognized,
                state: state.state,
                options: state.options,
                attemptCount: state.state['attemptCount']
            });
            if (state.state['attemptCount'] !== undefined) {
                state.state['attemptCount']++;
            }
        } else if (recognized.succeeded) {
            isValid = true;
        } else {
            // User used text input instead of card input
            if (this._inputFailMessage) {
                await dc.context.sendActivity(this._inputFailMessage);
            }
        }

        // Return recognized value or re-prompt
        if (isValid) {
            return await dc.endDialog(recognized.value);
        } else {
            if (!dc.context.responded) {
                await this.onPrompt(dc.context, state.state, state.options, true);
            }
            return await Dialog.EndOfTurn;
        }
    }

    private validatePromptContainsCard(options: PromptOptions, isRetry: boolean): void {
        const attachments = (options.prompt as Partial<Activity>).attachments;
        const retryAttachments = (options.prompt as Partial<Activity>).attachments;
        const adaptiveCardType = 'application/vnd.microsoft.card.adaptive';

        if (!isRetry && (attachments.length === 0 || attachments[0].contentType !== adaptiveCardType )) {
            throw new Error('AdaptiveCardPrompt must have an Adaptive Card in PromptOptions.prompt.attachments');
        } else if (isRetry && (retryAttachments.length === 0 || retryAttachments[0].contentType !== adaptiveCardType)) {
            throw new Error('AdaptiveCardPrompt must have an Adaptive Card in PromptOptions.retryPrompt.attachments');
        }
    }
}

/**
 * @private
 */
interface PromptState {
    state: object;
    options: PromptOptions;
}