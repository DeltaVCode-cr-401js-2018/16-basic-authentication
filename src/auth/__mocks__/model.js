'use strict';

export default {
  authenticate: (auth)=> {
    if(auth.username.toUpperCase() === auth.password) {
      return Promise.resolve({
        username: auth.username,
        generateToken: function() {
          return this.username + ' token!';
        },
      });
    }

    return Promise.resolve(null);
  },
};