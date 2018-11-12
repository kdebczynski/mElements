import { takeLatest } from "redux-saga/effects";
import { actionTypes } from "./consts";
import { routes } from "consts";
import history from "utils/history";

export function* favouritesSearchWatcher () {
    yield takeLatest(actionTypes.FAVOURITES_SEARCH_INITIATED, searchFavourites);
}

export function* searchFavourites(action) {
    history.push(`${routes.RESULTS}/${action.payload.id}`);
}