import { PromptValidator, DialogContext, PromptOptions, DialogTurnResult, Prompt, PromptRecognizerResult, Dialog } from "botbuilder-dialogs";
import { InputHints, TurnContext, Activity, ActionTypes, Attachment } from "botbuilder";

export interface AdaptiveCardPromptOptions {
    card?: Attachment;
    inputFailMessage?: string;
    requiredInputIds?: string[];
    missingRequiredInputsMessage?: string;
}

export class AdaptiveCardPrompt extends Prompt<object> {
    private _validator: PromptValidator<object>;
    private static _inputFailMessage: string;
    private _requiredInputIds: string[];
    private static _missingRequiredInputsMessage: string;
    private uniqueCardId: string;
    private card: Attachment;

    public constructor(dialogId: string, validator?: PromptValidator<object>, options?: AdaptiveCardPromptOptions) {
        super(dialogId, validator);
        
        this._validator = validator;
        AdaptiveCardPrompt._inputFailMessage = options.inputFailMessage || 'Please fill out the Adaptive Card';

        this._requiredInputIds = options.requiredInputIds;
        AdaptiveCardPrompt._missingRequiredInputsMessage = options.missingRequiredInputsMessage || 'The following inputs are required';

        // Should use GUID for C# -- it isn't native to Node, so this keeps dependencies down
        this.uniqueCardId = `${ Date().toString() }_${ Math.random() }`;

        this.card = options.card;
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
        let prompt = isRetry && options.retryPrompt ? (options.retryPrompt as Partial<Activity>) : (options.prompt as Partial<Activity>);

        // Create a prompt if user didn't pass it in through PromptOptions
        if (!prompt) {
            prompt = {
                attachments: []
            };
        }

        // Use card passed in PromptOptions or if it doesn't exist, use the one passed in from the constructor
        prompt.attachments[0] = prompt.attachments[0] ? this.addCardIdToCard(prompt.attachments[0]) : this.addCardIdToCard(this.card);

        this.validatePromptContainsCard(prompt, isRetry);

        await context.sendActivity(prompt, undefined, InputHints.ExpectingInput);
    }

    protected async onRecognize(context: TurnContext): Promise<PromptRecognizerResult<object>> {
        // Ignore user input that doesn't come from adaptive card
        if (context.activity.channelData && context.activity.channelData[ActionTypes.PostBack]) {
            // Validate it comes from the correct card - This is only a worry while the prompt/dialog has not ended
            if (context.activity.value && context.activity.value['uniqueCardId'] != this.uniqueCardId) {
                return { succeeded: false };
            }
            // Check for required input data
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

    private throwNoCardError(isRetry: boolean): void {
        const cardLocation = isRetry ? 'retryPrompt' : 'prompt';
        throw new Error(`No Adaptive Card provided. Include in the constructor or PromptOptions.(${ cardLocation } as Activity).attachments[0]`);
    }

    private validatePromptContainsCard(prompt: Partial<Activity>, isRetry: boolean): void {
        const adaptiveCardType = 'application/vnd.microsoft.card.adaptive';

        if (prompt.attachments.length === 0 || prompt.attachments[0].contentType !== adaptiveCardType) {
            this.throwNoCardError(isRetry);
        }
    }

    private addCardIdToCard(card: Attachment): Attachment {
        card.content = this.deepSearchJsonForActionsAndAddData(card.content, this.uniqueCardId);
        return card;
    }

    private deepSearchJsonForActionsAndAddData(json: object, dataValue: string): object {
        const submitAction = 'Action.Submit';
        const showCardAction = 'Action.ShowCard';
    
        for (const key in json) {
            // Search for all submits in actions
            if (key === 'actions') {
                for (const action in json[key]) {
                    if (json[key][action].type && json[key][action].type === submitAction) {
                        json[key][action].data = { ...json[key][action].data, ...{ uniqueCardId: dataValue }};
    
                    // Recursively search Action.ShowCard for Submits within the nested card
                    } else if (json[key][action].type && json[key][action].type === showCardAction) {
                        json[key][action] = this.deepSearchJsonForActionsAndAddData(json[key][action], dataValue);
                    }
                }
                
            // Search for all submits in selectActions
            } else if (key === 'selectAction') {
                if (json[key].type && json[key].type === submitAction) {
                    json[key].data = { ...json[key].data, ...{ uniqueCardId: dataValue }};
    
                // Recursively search Action.ShowCard for Submits within the nested card
                } else if (json[key].type && json[key].type === showCardAction) {
                    json[key] = this.deepSearchJsonForActionsAndAddData(json[key], dataValue);
                }
    
            // Recursively search all other objects
            } else if (json[key] && typeof json[key] === 'object') {
                json[key] = this.deepSearchJsonForActionsAndAddData(json[key], dataValue);
            }
        }
        return json;
    }
}

/**
 * @private
 */
interface PromptState {
    state: object;
    options: PromptOptions;
}