
// private _cardSubmittedMessage: string = 'This Adpative Card has already been submitted';
// private static completeCards: object = {};
// private cardId: string;

    
// this.cardId = new Date().toString();
// AdaptiveCardPrompt.completeCards = { ...AdaptiveCardPrompt.completeCards, [this.cardId]: false };

// public set cardSubmittedMessage(newMessage: string) {
//     this._cardSubmittedMessage = newMessage;
// }
    
// (prompt as Partial<Activity>).channelData = {
//     cardId: this.cardId
// };
// //TODO: Make separate, better function
// ((prompt as Partial<Activity>).attachments[0].content['actions'][0] as object)['data'] = { cardId: this.cardId };

    
//     // Ensure the card hasn't previously been submitted
//     if (this.cardWasPreviouslySubmitted(dc)) {
//         await dc.context.sendActivity(this._cardSubmittedMessage);

            

// private cardWasPreviouslySubmitted(dc: DialogContext): boolean {
//     const activity = dc.context.activity;
//     if (activity.value && activity.value.cardId && AdaptiveCardPrompt[activity.value.cardId]) {
//         return true;
//     }
//     return false;
// }