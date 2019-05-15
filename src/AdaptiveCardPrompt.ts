import { PromptValidator, DialogContext, PromptOptions, DialogTurnResult, Prompt, PromptRecognizerResult, Dialog } from "botbuilder-dialogs";
import { InputHints, TurnContext, Activity, ActionTypes, Attachment } from "botbuilder";

export interface AdaptiveCardPromptOptions {
    card?: Attachment;
    inputFailMessage?: string;
    requiredInputIds?: string[];
    missingRequiredInputsMessage?: string;
    attemptsBeforeCardRedisplayed?: number;
}

export class AdaptiveCardPrompt extends Prompt<object> {
    private _validator: PromptValidator<object>;
    private static _inputFailMessage: string;
    private _requiredInputIds: string[];
    private static _missingRequiredInputsMessage: string;
    private _attemptsBeforeCardRedisplayed: number;
    private _promptId: string;
    private _card: Attachment;

    public constructor(dialogId: string, validator?: PromptValidator<object>, options?: AdaptiveCardPromptOptions) {
        super(dialogId, validator);
        
        this._validator = validator;
        AdaptiveCardPrompt._inputFailMessage = options.inputFailMessage || 'Please fill out the Adaptive Card';

        this._requiredInputIds = options.requiredInputIds;
        AdaptiveCardPrompt._missingRequiredInputsMessage = options.missingRequiredInputsMessage || 'The following inputs are required';

        this._attemptsBeforeCardRedisplayed = options.attemptsBeforeCardRedisplayed || 3;

        this._card = options.card;
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

    public set card(newCard: Attachment) {
        this._card = newCard;
    }

    protected async onPrompt(context: TurnContext, state: object, options: PromptOptions, isRetry: boolean): Promise<void> {
        // Should use GUID for C# -- it isn't native to Node, so this keeps dependencies down
        // Only the most recently-prompted card submission is accepted
        this._promptId = `${ Math.random() }`;

        let prompt = isRetry && options.retryPrompt ? (options.retryPrompt as Partial<Activity>) : (options.prompt as Partial<Activity>);

        // Create a prompt if user didn't pass it in through PromptOptions
        if (!prompt) {
            prompt = {
                attachments: []
            };
        }

        // Use card passed in PromptOptions or if it doesn't exist, use the one passed in from the constructor
        const card = prompt.attachments[0] ? prompt.attachments[0] : this._card;
        
        this.validateIsCard(card, isRetry);

        prompt.attachments[0] = this.addPromptIdToCard(card);

        await context.sendActivity(prompt, undefined, InputHints.ExpectingInput);
    }

    protected async onRecognize(context: TurnContext): Promise<PromptRecognizerResult<object>> {
        // Ignore user input that doesn't come from adaptive card
        if (context.activity.channelData && context.activity.channelData[ActionTypes.PostBack]) {
            // Validate it comes from the correct card - This is only a worry while the prompt/dialog has not ended
            if (context.activity.value && context.activity.value['promptId'] != this._promptId) {
                return { succeeded: false };
            }
            // Check for required input data, if specified in AdaptiveCardPromptOptions
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

        if (state.state['attemptCount'] === undefined) {
            state.state['attemptCount'] = 1;
        } else {
            state.state['attemptCount']++;
        }

        let isValid = false;
        if (this._validator && recognized.succeeded) {
            isValid = await this._validator({
                context: dc.context,
                recognized: recognized,
                state: state.state,
                options: state.options,
                attemptCount: state.state['attemptCount']
            });
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
            if (state.options.retryPrompt || state.state['attemptCount'] % this._attemptsBeforeCardRedisplayed === 0 ) {
                await this.onPrompt(dc.context, state.state, state.options, true);
            }
            return await Dialog.EndOfTurn;
        }
    }

    private validateIsCard(card: Attachment, isRetry: boolean): void {
        const adaptiveCardType = 'application/vnd.microsoft.card.adaptive';

        if (!card || !card.contentType || card.contentType !== adaptiveCardType) {
            const cardLocation = isRetry ? 'retryPrompt' : 'prompt';
            throw new Error(`No Adaptive Card provided. Include in the constructor or PromptOptions.${ cardLocation }.attachments[0]`);
        }
    }

    private addPromptIdToCard(card: Attachment): Attachment {
        card.content = this.deepSearchJsonForActionsAndAddPromptId(card.content);
        return card;
    }

    private deepSearchJsonForActionsAndAddPromptId(json: object): object {
        const submitAction = 'Action.Submit';
        const showCardAction = 'Action.ShowCard';
    
        for (const key in json) {
            // Search for all submits in actions
            if (key === 'actions') {
                for (const action in json[key]) {
                    if (json[key][action].type && json[key][action].type === submitAction) {
                        json[key][action].data = { ...json[key][action].data, ...{ promptId: this._promptId }};
    
                    // Recursively search Action.ShowCard for Submits within the nested card
                    } else if (json[key][action].type && json[key][action].type === showCardAction) {
                        json[key][action] = this.deepSearchJsonForActionsAndAddPromptId(json[key][action]);
                    }
                }
                
            // Search for all submits in selectActions
            } else if (key === 'selectAction') {
                if (json[key].type && json[key].type === submitAction) {
                    json[key].data = { ...json[key].data, ...{ promptId: this._promptId }};
    
                // Recursively search Action.ShowCard for Submits within the nested card
                } else if (json[key].type && json[key].type === showCardAction) {
                    json[key] = this.deepSearchJsonForActionsAndAddPromptId(json[key]);
                }
    
            // Recursively search all other objects
            } else if (json[key] && typeof json[key] === 'object') {
                json[key] = this.deepSearchJsonForActionsAndAddPromptId(json[key]);
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