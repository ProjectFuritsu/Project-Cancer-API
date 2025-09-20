const jwt = require("jsonwebtoken");
/*
  Function to generate JWT access token
  - Uses user info as payload
  - Signs with ACCESS_TOKEN_SECRET

  * Parameters:
    user (object): User information to include in the token payload

  * Returns:
    string: Signed JWT access token
*/
function GenerateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
}

module.exports=GenerateAccessToken