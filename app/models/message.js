
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , paginator = require('mongoose-paginator')


// message schema
var messageSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    created: Date,
    body: String,
    body_html: String,
})

// pagination defaults
messageSchema.plugin(paginator, {
    limit: 50,
    defaultKey: '_id',
    direction: -1
})

// and model
mongoose.model('Message', messageSchema);
