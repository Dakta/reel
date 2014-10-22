
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , paginator = require('mongoose-paginator')


// conversation schema
var conversationSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    created: Date,
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
    is_public: Boolean,
    name: String,
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
})

// pagination defaults
conversationSchema.plugin(paginator, {
    limit: 15,
    defaultKey: '_id',
    direction: 1
})

// and model
mongoose.model('Conversation', conversationSchema);
