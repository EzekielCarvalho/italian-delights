import Search from './models/Search';
import Recipe from './models/recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


/** Global state of the app 
 * Search object
 * current recipe object
 * shopping list object
 * Liked recipes
*/
const state = {};


// SEARCH CONTRLLER

const controlSearch = async () => {
// 1) Get query from view
const query = searchView.getInput();

if(query) {
                //2) New search object and add to state
             state.search = new Search(query);

              //3) Prepare UI for results
            searchView.clearInput();
            searchView.clearResults();
            renderLoader(elements.searchRes);


            try {

                    //4) Search for recipes
                await state.search.getResults();

                //5) Render results on UI
                clearLoader();
                searchView.renderResults(state.search.result);

            } catch (err) {
                alert('something wrong with the search...');
                clearLoader();
            }
             
             }

};

elements.searchForm.addEventListener('submit', e => {e.preventDefault();
    controlSearch();
});




elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
 
    }
});


// RECIPE CONTROLLER
//const r = new Recipe(47746);
//r.getRecipe();
//console.log(r);

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');


    if (id) {
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
       if (state.search) searchView.highLightSelected(id);
        //Create new recipe object
            state.recipe = new Recipe(id);
        

        try {

               //Get recipe data and parse ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();

        //Calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();        

        // Render recipe
        clearLoader();
        recipeView.renderRecipe(state.recipe, 
            state.likes.isLiked(id)
            );
        } catch (err) {
            console.log(err);
            alert('Error processing recipe!');
        }

     
    }

};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


//LIST CONTROLLER

const controlList = () => {
    // create a new list if there is none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
      const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Handle delete and update list item evens
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

//LIKE CONTROLLER


const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
       

        // Toggle the like button
        likesView.toggleLikeBtn(true);

        //Add like to the UI list
        likesView.renderLike(newLike);
    

    //User HAS liked current recipe
    } else {

        //Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        //Remove like to the UI list
        likesView.deleteLikes(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//restore liked recipes on page loads
window.addEventListener('load', () => {
    state.likes = new Likes();

    // restore likes
    state.likes.readStorage();

    // toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // decrease button is clicked
        if (state.recipe.servings >1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
       
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
      // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches ('.recipe__love, .recipe__love *')) {

        //Like controller
        controlLike();
    }
});

