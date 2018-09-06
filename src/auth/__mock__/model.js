'use strict';
export default {
  authenticate: (auth) => {
    if (auth.username.toUpperCase() === auth.password) {
      return Promise.resolve({
        username: auth.username,
        // Can't use arrow function so we can see this
        generateToken: function () {
          console.log('generateToken called');
          return this.username + ' token!';
        },
      });
    }
    return Promise.resolve(null);
  },

  authorize: (token)=>{
    if(token && token.match(/DeltaV/)){
      return Promise.resolve({
        username: 'cashmann',
      });
    }
    return Promise.resolve(null);
  },
};