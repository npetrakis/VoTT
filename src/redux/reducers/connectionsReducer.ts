import _ from "lodash";
import { ActionTypes } from "../actions/actionTypes";
import { IConnection, ProjectStatus } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

/**
 * Reducer for application connections. Actions handled:
 * SAVE_CONNECTION_SUCCESS
 * DELETE_CONNECTION_SUCCESS
 * LOAD_PROJECT_SUCCESS
 * @param state - Current array of connections
 * @param action - Action that was dispatched
 */
export const reducer = (state: IConnection[] = [], action: AnyAction): IConnection[] => {
    if (!state) {
        state = [];
    }

    switch (action.type) {
        case ActionTypes.FETCH_CONNECTION_PROJECT_STATUSES_SUCCESS:
            const projectStatuses = action.payload;
            const connections = [];
            Object.keys(projectStatuses).forEach((projectName) => {
                const copiedConnection = { ...state.find((connection) => {
                    return connection.name === projectName;
                })};
                if (copiedConnection) {
                    copiedConnection.status = ProjectStatus[projectStatuses[projectName]];
                    connections.push(copiedConnection);
                }
            });
            const ids = connections.map((connection) => connection.id);
            return [ ...connections,
                ...state.filter((connection) => ids.indexOf(connection.id) === -1),
            ];
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            return [
                { ...action.payload },
                ...state.filter((connection) => connection.id !== action.payload.id),
            ];
        case ActionTypes.SAVE_CONNECTIONS_SUCCESS:
            const connectionIds = action.payload.map((connection) => {
                return connection.id;
            });
            return [
                ...action.payload,
                ...state.filter((connection) => connectionIds.indexOf(connection.id) === -1),
            ];
        case ActionTypes.DELETE_CONNECTION_SUCCESS:
            return [...state.filter((connection) => connection.id !== action.payload.id)];
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            const isSourceTargetEqual = action.payload.sourceConnection.id === action.payload.targetConnection.id;
            const stateSourceConnection = state.find(
                (connection) => connection.id === action.payload.sourceConnection.id);

            action.payload.sourceConnection.status = stateSourceConnection.status;
            if (isSourceTargetEqual) {
                return [
                    { ...action.payload.sourceConnection },
                    ...state.filter((connection) => connection.id !== action.payload.sourceConnection.id),
                ];
            }
            const stateTargetConnection = state.find(
                (connection) => connection.id === action.payload.targetConnection.id);
            action.payload.targetConnection.status = stateTargetConnection.status;

            return [
                { ...action.payload.sourceConnection },
                { ...action.payload.targetConnection },
                ...state.filter((connection) => {
                    return connection.id !== action.payload.sourceConnection.id &&
                        connection.id !== action.payload.targetConnection.id;
                })];
        default:
            return state;
    }
};
