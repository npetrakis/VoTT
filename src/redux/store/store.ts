import { applyMiddleware, createStore, Store } from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducers";
import { IApplicationState } from "../../models/applicationState";
import { createAppInsightsLogger } from "../middleware/appInsights";
import { createConnectionStatusFetcher, mergeSASFromLocalStorage } from "../middleware/connectionStatuses";

import { Env } from "../../common/environment";

/**
 * Creates initial redux store from initial application state
 * @param initialState - Initial state of application
 * @param useLocalStorage - Whether or not to use localStorage middleware
 */
export default function createReduxStore(
    initialState?: IApplicationState): Store {
    const paths: string[] = ["appSettings", "connections", "recentProjects"];

    let middlewares = [thunk, createAppInsightsLogger(), createConnectionStatusFetcher()];

    if (Env.get() === "development") {
        const logger = require("redux-logger");
        const reduxImmutableStateInvariant = require("redux-immutable-state-invariant");
        middlewares = [
            ...middlewares,
            reduxImmutableStateInvariant.default(),
            logger.createLogger(),
        ];
    }

    return createStore(
        rootReducer,
        mergeSASFromLocalStorage(initialState),
        applyMiddleware(...middlewares),
    );
}
