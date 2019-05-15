import { PromptValidator, DialogContext, PromptOptions, DialogTurnResult, Prompt, PromptRecognizerResult, Dialog } from "botbuilder-dialogs";
import { InputHints, TurnContext, Activity, ActionTypes, Attachment } from "botbuilder";

export interface AdaptiveCardPromptOptions {
    inputFailMessage?: string;
    requiredInputIds?: string[];
    missingRequiredInputsMessage?: string;
}

export class AdaptiveCardPrompt extends Prompt<object> {
    private _validator: PromptValidator<object>;
    private static _inputFailMessage: string;
    private _requiredInputIds: string[];
    private static _missingRequiredInputsMessage: string;

    public constructor(dialogId: string, validator?: PromptValidator<object>, options?: AdaptiveCardPromptOptions) {
        super(dialogId, validator);
        
        this._validator = validator;
        AdaptiveCardPrompt._inputFailMessage = options.inputFailMessage || 'Please fill out the Adaptive Card';

        this._requiredInputIds = options.requiredInputIds;
        AdaptiveCardPrompt._missingRequiredInputsMessage = options.missingRequiredInputsMessage || 'The following inputs are required';
    }

    public set inputFailMessage(newMessage: string|null) {
        AdaptiveCardPrompt._inputFailMessage = newMessage;
    }

    public set requiredInputIds(newIds: string[]|null) {
        this._requiredInputIds = newIds;
    }

    public set missingRequiredInputsMessage(newMessage: string|null) {
        AdaptiveCardPrompt._missingRequiredInputsMessage = newMessage;
    }

    protected async onPrompt(context: TurnContext, state: object, options: PromptOptions, isRetry: boolean): Promise<void> {        
        this.validatePromptContainsCard(options, isRetry);

        const prompt = isRetry && options.retryPrompt ? options.retryPrompt : options.prompt;
        await context.sendActivity(prompt, undefined, InputHints.ExpectingInput);
    }

    protected async onRecognize(context: TurnContext): Promise<PromptRecognizerResult<object>> {
        // TODO: Validate it comes from the correct card - GUID
        // Ignore user input that doesn't come from adaptive card
        if (context.activity.channelData && context.activity.channelData[ActionTypes.PostBack]) {
            let missingIds = [];
            this._requiredInputIds.forEach((id): void => {
                if (!context.activity.value[id] || !context.activity.value[id].trim()) {
                    missingIds.push(id);
                }
            });
            if (missingIds.length > 0) {
                if (AdaptiveCardPrompt._missingRequiredInputsMessage) {
                    await context.sendActivity(`${ AdaptiveCardPrompt._missingRequiredInputsMessage }: ${ missingIds.join(', ') }`);
                }
                return { succeeded: false };
            }
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
            // User used text input instead of card input or is missing required Inputs
            if (AdaptiveCardPrompt._inputFailMessage) {
                await dc.context.sendActivity(AdaptiveCardPrompt._inputFailMessage);
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