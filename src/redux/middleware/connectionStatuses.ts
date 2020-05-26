import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";
import { ActionTypes } from "../actions/actionTypes";
import { fetchAzureContainerConnections  } from "../actions/connectionActions";
import { fetchProjectStatuses  } from "../actions/projectActions";

export function createConnectionStatusFetcher(): Middleware {
    return (store: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
        if (action.type === ActionTypes.SAVE_SAS_SUCCESS) {
            fetchAzureContainerConnections(action.payload)(next, store.getState).then( (_) => {
                fetchProjectStatuses(action.payload)(next);
            });
            localStorage.setItem("sas", action.payload);
        }
        return next(action);
    };
}

export function mergeSASFromLocalStorage(state: any) {
    const initialState = { ...state };

    const sasFromLocalStorage = localStorage.getItem("sas");
    if (sasFromLocalStorage) {
        initialState.appSettings.sas = sasFromLocalStorage;
    }
    return initialState;
}
