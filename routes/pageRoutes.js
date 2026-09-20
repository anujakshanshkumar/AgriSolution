const pageController = require('../controllers/pageController');

function handleRequest(request, response) {
  pageController.handle(request, response);
}

module.exports = { handleRequest };
