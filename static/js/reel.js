// App
Reel = Em.Application.create({
    Socket: EmberSockets.extend({
        controllers: ['chat'],
        autoConnect: true
    })
});

// bye-bye hashbang
Reel.Router.reopen({ location: 'history' });

// Routes
Reel.Router.map(function() {
    this.resource('users', { path: '/users' });
});

Reel.Serializable = Ember.Mixin.create({
    serialize: function ()
    {
        var result = {};
        for (var key in $.extend(true, {}, this))
        {
            // Skip these
            if (key === 'isInstance' ||
            key === 'isDestroyed' ||
            key === 'isDestroying' ||
            key === 'concatenatedProperties' ||
            typeof this[key] === 'function')
            {
                continue;
            }
            result[key] = this[key];
        }
        return result;
    }
});

// Message Model that we can serialize
Reel.Message = Ember.Object.extend(Reel.Serializable, {
/*
    'uid': null,
    'unconfirmed': true, // hide to begin with, until we confirm
    'display_name': null,
    'message': null
*/
});

Reel.ApplicationRoute = Em.Route.extend({
    // scaffolding
    // this is where we set up the sidebars and main content area
    
    renderTemplate: function() {
        // have to render the application template first, then we can inject into it
        // http://stackoverflow.com/questions/14598048/how-does-render-template-render-the-custom-templates-into-the-outlets-defined-in#comment21419047_14598671
        this.render();

        this.render('messages', {
            controller: 'chat',
            into: 'application',
            outlet: 'page' // Why does this work but not any of the other names?
        });
        
        this.render('online', {
            controller: 'chat',
            into: 'application',
            outlet: 'rightside' // Why does this work but not any of the other names?
        });

/*
        this.render('application', {
            controller: 'index',
            outlet: 'leftside'
        });
*/
/*
        this.render('application', {
            controller: 'index',
            outlet: 'rightside',
        });
*/
        
    }
});


// overall layout stuff
// provides JS hooks for snap.js using MediaCheck
Reel.ApplicationView = Em.View.extend({
    didInsertElement: function(){
        var snapper = new Snap({
            element: document.getElementById('content'),
            maxPosition: 160,
            minPosition: -160
        });
        
        this.$('#open-left').click(function(){
        	snapper.open('left');
        });
        this.$('#open-right').click(function(){
        	snapper.open('right');
        });
        
        mediaCheck({
          media: '(max-width: 768px)',
          entry: function() {
            snapper.close();
            snapper.enable();
          },
          exit: function() {
            snapper.close();
            snapper.disable();
          },
          both: function() {
            console.log('changing state');
          }
        });
    }

});

Reel.ChatController = Em.Controller.extend({
    /**
     * @property actions
     * @type {Object}
     */
    actions: {

        /**
         * @method cherryPickName
         * @emit cherryPickName
         * @return {void}
         */
        sendMsg: function(message) {
            console.log('sendMsg', this.get('lastMsg'));
            
            var data = Reel.Message.create({
              'client_created': Date.now(),
              'unconfirmed': true, // hide to begin with, until we confirm
              'author': this.profile,
              'body': message,
              'body_html': marked(message)
            });
            
            this.messages.pushObject(data)
            
            this.socket.emit('msg', data, function(response) {
                data.set('unconfirmed', false);
                console.log('response!', response);
            });
            
            // clear text input
            this.set('lastMsg', '');
        },
    },
    
    // somewhere in here we call this.join('socket channel name')
    // this should be used to subscribe to conversations
    // also notifications and meta

    /**
     * @property sockets
     * @type {Object}
     */
    sockets: {

        // Update the property using a callback.
        userlist: function(userlist) {
            console.log('got userlist', userlist);
            this.set('title', "well, this is wrong.");
            this.set('userlist', userlist);
        },
        
        msg: function(data) {
            console.log('got message', data);
            // check to see if we have it already
            // if not:
            this.messages.pushObject(Reel.Message.create(data));
        },
        
        raw: function(data) {
            console.log(data);
        },

        set_self: function(prof) {
            console.log('got self', prof);
            this.profile = prof;
        },
        
        // When EmberSockets makes a connection to the Socket.IO server.
        connect: function() {
            console.log('EmberSockets has connected...');
        },

        // When EmberSockets disconnects from the Socket.IO server.
        disconnect: function() {
            console.log('EmberSockets has disconnected...');
        }

    },


    /**
     * @property userlist
     * @type {Array}
     */
    userlist: [],
    
    /**
     * @ property last_message
     * @type {String}
     */
    lastMsg: "",
    
    messages: Ember.A(),
/*         messages: Ember.Map.create(), */
    
    profile: {}

});

/*
Reel.UsersRoute = Ember.Route.extend({
  setupController: function(controller) {
    controller.set('model', );
  }
});
*/

Reel.UsersController = Ember.ArrayController.extend({
    model: Ember.A( [ { display_name: 'John Smith', age: 5 } ] )
});


