
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , paginator = require('mongoose-paginator')


// profile schema
var profileSchema = new mongoose.Schema({
//     uid: { type: String, default: flakeGen }, // we generate this with simpleflake, conv buffer to base58 string
    display_name: String, // for now, we're not picky
    avatar_url: String,
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
    provider_profile: Object
})

// pagination defaults
profileSchema.plugin(paginator, {
    limit: 50,
    defaultKey: '_id',
    direction: 1
})

// and model
mongoose.model('Profile', profileSchema)
