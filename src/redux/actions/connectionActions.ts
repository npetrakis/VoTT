import shortid from "shortid";
import { IConnection, ProjectStatus } from "../../models/applicationState";
import { ActionTypes } from "./actionTypes";
import { IPayloadAction, createPayloadAction } from "./actionCreators";
import { Dispatch } from "redux";
import ConnectionService from "../../services/connectionService";
import { IAzureCloudStorageOptions, AzureBlobStorage } from "../../providers/storage/azureBlobStorage";
import { connect } from "net";
import { StorageProviderFactory } from "../../providers/storage/storageProviderFactory";
// tslint:disable-next-line: no-var-requires
require("dotenv").config();

/**
 * Actions to be performed in relation to connections
 */
export default interface IConnectionActions {
    loadConnection(connection: IConnection): Promise<IConnection>;
    saveConnection(connection: IConnection): Promise<IConnection>;
    saveConnections(connections: IConnection[]): Promise<IConnection[]>;
    fetchAzureContainerConnections();
    deleteConnection(connection: IConnection): Promise<void>;
}

/**
 * Dispatches Load Connection action and resolves with IConnection
 * @param connection - Connection to load
 */
export function loadConnection(connection: IConnection): (dispatch: Dispatch) => Promise<IConnection> {
    return (dispatch: Dispatch) => {
        dispatch(loadConnectionAction(connection));
        return Promise.resolve(connection);
    };
}

/**
 * Dispatches Save Connection action and resolves with IConnection
 * @param connection - Connection to save
 */
export function saveConnection(connection: IConnection): (dispatch: Dispatch) => Promise<IConnection> {
    return async (dispatch: Dispatch) => {
        const connectionService = new ConnectionService();
        await connectionService.save(connection);
        dispatch(saveConnectionAction(connection));
        return Promise.resolve(connection);
    };
}

/**
 * Dispatches Save Connections action and resolves with IConnection[]
 * @param connections - Connections to save
 */
export function saveConnections(connections: IConnection[]): (dispatch: Dispatch) => Promise<IConnection[]> {
    return async (dispatch: Dispatch) => {
        saveConnectionsToService(connections, dispatch);
        return Promise.resolve(connections);
    };
}

function saveConnectionsToService(connections: IConnection[], dispatch): void {
    const connectionService = new ConnectionService();
    connections.forEach(async (connection) => {
        await connectionService.save(connection);
    });
    dispatch(saveConnectionsAction(connections));
}
/**
 * Dispatches Fetch Connections For  Azure Containers action and resolves with IConnection[]
 */
export function fetchAzureContainerConnections(): (dispatch: Dispatch) => Promise<IConnection[]> {
    return async (dispatch: Dispatch) => {
        const environment = process.env;
        const accountName = environment.REACT_APP_ACCOUNT_NAME;
        const sas = environment.REACT_APP_SAS;
        const storage = StorageProviderFactory.create("azureBlobStorage", {
            accountName,
            sas,
        });
        const containers = await storage.listContainers(null);
        const connections = containers.map((container) => {
            const connection = {
                description: undefined,
                id: container,
                name: container,
                providerType: "azureBlobStorage",
                providerOptions: {
                    accountName,
                    containerName: container,
                    createContainer: false,
                    sas,
                },
            };
            return connection;
        });
        saveConnectionsToService(connections, dispatch);
        return Promise.resolve(connections);
    };
}

/**
 * Dispatches Delete Connection action and resolves with IConnection
 * @param connection - Connection to delete
 */
export function deleteConnection(connection: IConnection): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        dispatch(deleteConnectionAction(connection));
        return Promise.resolve();
    };
}

/**
 * Load connection action type
 */
export interface ILoadConnectionAction extends IPayloadAction<string, IConnection> {
    type: ActionTypes.LOAD_CONNECTION_SUCCESS;
}

/**
 * Save connection action type
 */
export interface ISaveConnectionAction extends IPayloadAction<string, IConnection> {
    type: ActionTypes.SAVE_CONNECTION_SUCCESS;
}

/**
 * Delete connection action type
 */
export interface IDeleteConnectionAction extends IPayloadAction<string, IConnection> {
    type: ActionTypes.DELETE_CONNECTION_SUCCESS;
}

/**
 * Save connections action type
 */
export interface ISaveConnectionsAction extends IPayloadAction<string, IConnection[]> {
    type: ActionTypes.SAVE_CONNECTIONS_SUCCESS;
}

/**
 * Fetch statuses of projects
 */
export interface IFetchConnectionProjectStatusesAction extends IPayloadAction<string, any> {
    type: ActionTypes.FETCH_CONNECTION_PROJECT_STATUSES_SUCCESS;
}

/**
 * Instance of load connection action
 */
export const loadConnectionAction = createPayloadAction<ILoadConnectionAction>(ActionTypes.LOAD_CONNECTION_SUCCESS);
/**
 * Instance of save connection action
 */
export const saveConnectionAction = createPayloadAction<ISaveConnectionAction>(ActionTypes.SAVE_CONNECTION_SUCCESS);
/**
 * Instance of delete connection action
 */
export const deleteConnectionAction =
    createPayloadAction<IDeleteConnectionAction>(ActionTypes.DELETE_CONNECTION_SUCCESS);
/**
 * Instance of save connection action
 */
export const saveConnectionsAction = createPayloadAction<ISaveConnectionsAction>(ActionTypes.SAVE_CONNECTIONS_SUCCESS);

/**
 * Instance of Fetch Project Statuses action
 */
export const fetchConnectionProjectStatusesAction =
createPayloadAction<IFetchConnectionProjectStatusesAction>(ActionTypes.FETCH_CONNECTION_PROJECT_STATUSES_SUCCESS);
