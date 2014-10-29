
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , paginator = require('mongoose-paginator')


// message schema
var messageSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    created: Date, // when we receive and process the message
    client_created: Date, // when the client claims to have generated the messaage
    body: String, // raw body passed to server
    body_html: String, // parsed and processed body
})

// pagination defaults
messageSchema.plugin(paginator, {
    limit: 50,
    defaultKey: 'created', // typically sort by most recent
    direction: -1
})

// and model
mongoose.model('Message', messageSchema);
