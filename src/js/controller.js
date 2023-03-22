import 'core-js/stable'; //for polyfilling everything else
import 'regenerator-runtime/runtime'; //for polyfilling async/await
import * as model from './model.js';
import { FORM_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';
///////////////////////////////////////
// if (module.hot) {
//   module.hot.accept;
// }
const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);

    //IF THE URL DOESN'T CONTAIN ID
    if (!id) return;
    recipeView.renderSpinner();

    // step 0: update results view to mark selected search result

    resultsView.update(model.getSearchResultPage());

    // step 1: updating bookmark view
    bookmarksView.update(model.state.bookmarks);

    // step 1: loading recipe
    await model.loadRecipe(id);

    // step 3: rendering recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    recipeView.renderError();
  }
};

const controlSearchResult = async function () {
  try {
    resultsView.renderSpinner();
    // 1) get search query
    const query = searchView.getQuery();
    if (!query) return;

    // 2) load search results
    await model.loadSearchResults(query);

    // 3) render results
    resultsView.render(model.getSearchResultPage());

    // 4) render initial pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlPagination = function (goToPage) {
  // 1: render new results
  resultsView.render(model.getSearchResultPage(goToPage));
  // 2: render new pagination buttons
  paginationView.render(model.state.search);
};

//no of servings
const controlServings = function (newServings) {
  // update the recipe servings(in state)
  model.updateServings(newServings);

  // update recipe view
  recipeView.update(model.state.recipe); //only updates text and attributes in the dom without having to re-render the entire view
};

const controlAddBookmark = function () {
  // 1. add/remove bookmarks
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  // 2) Update recipe view
  recipeView.update(model.state.recipe);

  // 3) Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // show loading spinner
    addRecipeView.renderSpinner();

    // upload the new recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // render recipe
    recipeView.render(model.state.recipe);

    // display a success message
    addRecipeView.renderMessage();

    // render the bookmark view
    bookmarksView.render(model.state.bookmarks);

    // change id in the url
    window.history.pushState(null, '', `#${model.state.recipe.id}`); //change the url without reloading the page

    // close form window
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, FORM_CLOSE_SEC * 1000);
  } catch (err) {
    console.error('oh nooo', err);
    addRecipeView.renderError(err.message);
  }
};
const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResult);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};
init();
